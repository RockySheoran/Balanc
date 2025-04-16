/** @format */

export const maxDuration = 60 // This function can run for a maximum of 5 seconds

export function GET(request: Request) {
  return new Response("Vercel", {
    status: 200,
  })
}
