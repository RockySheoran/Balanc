/** @format */
"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Lazy load the Register component with loading fallback
const Register = dynamic(() => import("@/Components/Auth/Register"), {
  loading: () => (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
    </div>
  ),
  ssr: false,
})

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="w-full px-10 md:w-[550px] shadow-neutral-800 rounded-xl py-5 bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">
            PFMA
          </h1>
          <h2 className="text-3xl font-bold mt-2">Register</h2>
          <p className="text-gray-600">Start clashing now</p>
        </div>

        <Suspense fallback={<div>Loading registration form...</div>}>
          <Register />
        </Suspense>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-purple-600 hover:underline"
            prefetch={false}>
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
