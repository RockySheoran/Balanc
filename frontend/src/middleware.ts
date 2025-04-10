// /** @format */

export { default } from "next-auth/middleware"

// export const config = {
//   matcher: ["/","/dashboard/:path*", "/profile"], // Apply middleware to /dashboard and /profile
// }
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//   // Skip middleware for static files and API routes
//   if (
//     request.nextUrl.pathname.startsWith('/_next') ||
//     request.nextUrl.pathname.includes('/api/') ||
//     request.nextUrl.pathname.includes('.') // Static files
//   ) {
//     return NextResponse.next();
//   }

//   // Add security headers
//   const response = NextResponse.next();
  
//   response.headers.set('X-Frame-Options', 'DENY');
//   response.headers.set('X-Content-Type-Options', 'nosniff');
//   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
//   return response;
// }

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/investment",
    "/expense",
    "/transaction",
    "/income",

    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}