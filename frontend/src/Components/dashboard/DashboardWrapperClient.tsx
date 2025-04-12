/** @format */



import { Suspense } from "react"

import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { getServerSession } from "next-auth"

import DashboardWrapper from "./DashboardWrapper"
import { DashboardServerWrapper } from "../base/DashboardClient"





export default async function DashboardWrapperClient() {
    const session = await getServerSession(authOptions)
  return (
    <>
      <Suspense
        fallback={
          <div className="h-64 bg-gray-200 animate-pulse rounded-md" />
        }>
        <DashboardWrapper />
      </Suspense>
      {/* <Suspense
        fallback={
          <div className="h-64 bg-gray-200 animate-pulse rounded-md" />
        }>
        <DashboardServerWrapper session={session} />
      </Suspense> */}
    </>
  )
}
