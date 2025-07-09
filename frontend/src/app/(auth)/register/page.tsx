/** @format */
"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import Link from "next/link"
import { useAppDispatch } from "@/lib/Redux/store/hooks"
import { clearUser } from "@/lib/Redux/features/user/userSlice"
import { clearIncome } from "@/lib/Redux/features/income/incomeSlices"
import { clearTransactions } from "@/lib/Redux/features/transactions/transactionsSlice"
import { clearExpense } from "@/lib/Redux/features/expense/expenseSlice"
import { clearAccount } from "@/lib/Redux/features/account/accountSlice"
import { clearInvestments } from "@/lib/Redux/features/investmentSlice/investmentSlice"
import { useEffect } from "react"

const RegisterForm = dynamic(
  () =>
    import("@/Components/Auth/Register")
      .then((mod) => {
        if (!("default" in mod)) {
          throw new Error("Register component has no default export")
        }
        return mod.default
      })
      .catch((err) => {
        console.error("Register component load error:", err)
        return {
          default: () => (
            <div className="text-red-500 text-center py-4">
              Failed to load registration form. Please try refreshing the page.
            </div>
          ),
        }
      }),
  {
    loading: () => (
      <div className="space-y-4" aria-busy="true" role="status">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-1/2 mx-auto" />
      </div>
    ),
    ssr: false,
  }
)

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    // Clear all relevant state on mount (consistent with login page)
    dispatch(clearUser())
    dispatch(clearIncome())
    dispatch(clearTransactions())
    dispatch(clearExpense())
    dispatch(clearAccount())
    dispatch(clearInvestments())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Decorative header - matches login page */}
         <div className="bg-gradient-to-r from-indigo-400 to-purple-400 p-6 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r text-transparent bg-clip-text from-pink-500 via-purple-600 to-indigo-700 tracking-tight">
              BALANC  
            </h1>
          </Link>
          <p className="mt-1 text-indigo-100">Your personal finance companion</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create your account</h2>
            <p className="text-gray-600 mt-1">Start managing your finances today</p>
          </div>

          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-full" />
            </div>
          }>
            <RegisterForm />
          </Suspense>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              prefetch
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}