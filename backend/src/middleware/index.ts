import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth";

const PUBLIC_PATHS = ["/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get("auth_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  
  const headers = new Headers(request.headers);
  headers.set("x-user-id", payload.userId.toString());
  headers.set("x-user-role", payload.role);
  headers.set("x-user-phone", payload.phone);
  
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
