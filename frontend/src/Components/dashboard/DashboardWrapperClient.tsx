/** @format */

"use client"

import { Suspense } from "react"
import DashboardWrapper from "./DashboardWrapper"



export default function DashboardWrapperClient() {
  return(
    <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse rounded-md" />}>
     
      <DashboardWrapper />
    </Suspense>
  )
}
