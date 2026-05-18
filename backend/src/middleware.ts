import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
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
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (err) {
        // Invalid token, allow staying on login
        return NextResponse.next();
      }
    }
  }

  // Handle API route protection (bridging the existing middleware logic)
  if (pathname.startsWith("/api/")) {
    const PUBLIC_API_PATHS = ["/api/auth", "/api/products", "/api/blogs", "/api/home"];
    const isPublic = PUBLIC_API_PATHS.some(path => pathname.startsWith(path));
    
    if (isPublic && request.method === "GET") {
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
    } catch (err) {
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
