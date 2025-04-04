
/** @format */
"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

// Direct dynamic imports with proper error handling
const LoginForm = dynamic(
  () =>
    import("@/Components/Auth/Login")
      .then((mod) => {
        if (!("default" in mod)) {
          throw new Error("Login component has no default export")
        }
        return mod.default
      })
      .catch((err) => {
        console.error("Login component load error:", err)
        return {
          default: () => (
            <div className="text-red-500">Error loading login form</div>
          ),
        }
      }),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
      </div>
    ),
    ssr: false,
  }
)



export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex justify-center items-center h-screen ">
      <div className="w-full md:w-[550px] shadow-md rounded-xl py-5 px-10 bg-white">
        <div>
          <h1 className="text-4xl text-center font-extrabold bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">
            PFMA
          </h1>
          <h1 className="text-3xl font-bold">Login</h1>
          <p>Welcome back</p>
        </div>
        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center mt-2">
          Don't have an account ?{" "}
          <strong>
            <Link href="/register">Register</Link>
          </strong>
        </p>
      </div>
    </div>
  )
}
