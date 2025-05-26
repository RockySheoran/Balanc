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
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  // If trying to access protected route without token
  if (protectedRoutes.includes(pathname) && !token) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // If trying to access login with token
  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && token) {
    return NextResponse.redirect(`${origin}/dashboard`);
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
    "/login",'/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};