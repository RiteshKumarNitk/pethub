import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

type Session = { userId: number; role: string } | null;

async function getSession(token: string | undefined): Promise<Session> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = Number((payload as Record<string, unknown>).userId);
    if (!Number.isFinite(userId) || userId <= 0) return null;
    return { userId, role: String((payload as Record<string, unknown>).role ?? "user") };
  } catch {
    return null;
  }
}

/**
 * Identity contract for the whole API:
 * `x-user-id` is ONLY ever set here, from a verified JWT. Any incoming
 * value is stripped first so it can never be spoofed by a client.
 * User-facing routes treat a missing x-user-id as "guest" and self-guard
 * where login is required; /api/admin/* is hard-protected below because
 * admin routes consume the header without re-checking the role.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request.cookies.get("auth_token")?.value);

  const forward = (init?: ResponseInit) => {
    const headers = new Headers(request.headers);
    headers.delete("x-user-id"); // never trust a client-supplied identity
    if (session) headers.set("x-user-id", String(session.userId));
    return NextResponse.next(init ? { request: { headers }, ...init } : { request: { headers } });
  };

  const json = (body: Record<string, string>, status: number) =>
    NextResponse.json(body, { status });

  // ---------- Page guards ----------
  if (pathname === "/admin/login") {
    if (session?.role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/admin/login", request.url));
    if (session.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (pathname.startsWith("/account")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL(session.role === "admin" ? "/admin" : "/account", request.url));
  }

  // ---------- API guards ----------
  // /api/cron guards itself with CRON_SECRET (external scheduler has no user JWT)
  if (pathname.startsWith("/api/cron")) {
    return forward();
  }
  if (pathname.startsWith("/api/admin/")) {
    if (!session) return json({ error: "Unauthorized" }, 401);
    if (session.role !== "admin") return json({ error: "Forbidden: Admin only" }, 403);
    return forward();
  }

  // All other API routes: verified users get x-user-id, everyone else is a guest.
  // Routes that require login (wishlist, notifications, addresses, ...) return
  // 401 themselves when the header is absent.
  return forward();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/api/:path*"],
};
