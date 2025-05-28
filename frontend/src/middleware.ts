// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Define session duration in seconds (e.g., 1 hour = 3600 seconds)
const SESSION_DURATION = 5 * 24 * 60 * 60;

export async function middleware(req: NextRequest) {
  const { pathname, origin, searchParams } = req.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get token with enhanced error handling
  let token;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/login?error=session_invalid", origin));
  }

  // Check if token exists and is not expired
  const now = Math.floor(Date.now() / 1000);
  const isTokenExpired = typeof token?.initialTokenTime === "number"
    ? now - token.initialTokenTime > SESSION_DURATION
    : true;

  // Handle root path redirect
  if (pathname === "/") {
    if (!token || isTokenExpired) {
      return NextResponse.redirect(new URL("/login", origin));
    }
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // Handle protected routes
  const protectedRoutes = [
    "/dashboard",
    "/investment",
    "/expense",
    "/transaction",
    "/income",
  ];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token || isTokenExpired) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      if (isTokenExpired) {
        loginUrl.searchParams.set("expired", "true");
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (login/register)
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token && !isTokenExpired) {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      return NextResponse.redirect(new URL(callbackUrl, origin));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/investment",
    "/expense",
    "/transaction",
    "/income",
    "/login",
    "/register",
  ],
};