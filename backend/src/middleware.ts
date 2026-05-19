import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // Allow admin login page without auth
  if (pathname === "/admin/login") {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } catch {
        // Invalid token, allow login
      }
    }
    return NextResponse.next();
  }

  // Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect Dashboard Routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect if already logged in (Login Page)
  if (pathname === "/login") {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Invalid token, allow staying on login
        return NextResponse.next();
      }
    }
  }

  // Protect Admin API routes - require admin role
  if (pathname.startsWith("/api/admin/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
      }
      const headers = new Headers(request.headers);
      headers.set("x-user-id", (payload as any).userId.toString());
      return NextResponse.next({ request: { headers } });
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  // Handle API route protection (bridging the existing middleware logic)
  if (pathname.startsWith("/api/")) {
    const PUBLIC_API_PATHS = ["/api/auth", "/api/products", "/api/blogs", "/api/home"];
    const isPublic = PUBLIC_API_PATHS.some(path => pathname.startsWith(path));
    
    if (isPublic) {
        return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const headers = new Headers(request.headers);
      headers.set("x-user-id", (payload as any).userId.toString());
      return NextResponse.next({ request: { headers } });
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/api/:path*"
  ],
};
