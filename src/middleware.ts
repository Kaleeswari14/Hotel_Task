import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "hotel-pos-secure-jwt-secret-key-production-2025"
);

const AUTH_COOKIE_NAME = "hotel_pos_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, images, favicon, api routes for auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/whatsapp") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let user: { role?: string; name?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      user = payload as any;
    } catch {
      user = null;
    }
  }

  const isLoginPage = pathname === "/login";
  const isOwnerRoute = pathname.startsWith("/owner");
  const isStaffRoute = pathname.startsWith("/pos") || pathname.startsWith("/bills");
  const isApiRoute = pathname.startsWith("/api");

  // If user is NOT logged in:
  if (!user) {
    if (isOwnerRoute || isStaffRoute || pathname === "/") {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    if (isApiRoute && !pathname.startsWith("/api/auth")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // If user IS logged in and visits /login or /
  if (isLoginPage || pathname === "/") {
    if (user.role === "OWNER") {
      return NextResponse.redirect(new URL("/owner/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
  }

  // RBAC Guard: If STAFF tries to access OWNER routes
  if (isOwnerRoute && user.role !== "OWNER") {
    return NextResponse.redirect(new URL("/pos?error=unauthorized_owner_access", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
