/** @format */

export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/","/dashboard/:path*", "/profile"], // Apply middleware to /dashboard and /profile
}