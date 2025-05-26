
// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { JWT } from "next-auth/jwt";

interface MiddlewareRequest extends NextRequest {}



export async function middleware(req: MiddlewareRequest): Promise<NextResponse> {
  const token: JWT | null = await getToken({ req });
  const { pathname, origin } = req.nextUrl;

  // Protected routes
  const protectedRoutes: string[] = [
    "/",
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