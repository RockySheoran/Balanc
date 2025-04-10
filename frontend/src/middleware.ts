/** @format */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"

// Main middleware function
export default withAuth(
  function middleware(request: NextRequest) {
    // Add security headers to all responses
    const response = NextResponse.next()

    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    )

    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // If no token exists, redirect to login
        return !!token
      },
    },
    pages: {
      signIn: "/login", // Your custom login page
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/investment",
    "/expense",
    "/transaction",
    "/income",
    // Exclude static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
