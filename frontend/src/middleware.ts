/** @format */



export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/investment",
    "/expense",
    "/transaction",
    "/income",
  ],
}
