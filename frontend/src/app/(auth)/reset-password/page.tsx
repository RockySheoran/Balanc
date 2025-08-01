/** @format */

import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import ResetPassword from "@/Components/Auth/ResetPassword"

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import React from "react"

export default async function resetPassword() {
  const session = await getServerSession(authOptions)
  if (session !== null) {
    redirect("/dashboard")
  }
  return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="w-full md:w-[550px] shadow-md rounded-xl py-5 px-10 bg-white">
        <div>
          <h1 className="text-4xl text-center font-extrabold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
            BALANC
          </h1>
          <h1 className="text-3xl font-bold mt-2">Reset Password</h1>
        </div>
        <ResetPassword />
      </div>
    </div>
  )
}
