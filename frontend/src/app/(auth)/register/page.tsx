/** @format */
"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import type { NextPage } from "next"

// Components
const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded-md" />
    ))}
  </div>
)

// Optimized dynamic import with type safety
const RegisterForm = dynamic(
  () => import("@/Components/Auth/Register").then((mod) => mod.default),
  {
    loading: () => <SkeletonLoader />,
    ssr: false,
  }
)

const RegisterPage: NextPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="w-full px-4 sm:px-10 max-w-[550px] py-5 mx-4 bg-white rounded-xl shadow-xl">
        <header className="text-center">
          <h1 className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-3xl sm:text-4xl font-extrabold text-transparent">
            BALANC
          </h1>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-800">
            Register
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Start your journey now
          </p>
        </header>

        <main className="mt-6">
          <Suspense fallback={<SkeletonLoader />}>
            <RegisterForm />
          </Suspense>
        </main>

        <footer className="mt-6 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:underline hover:text-purple-700 transition-colors duration-200"
              prefetch={true}>
              Login
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default RegisterPage
