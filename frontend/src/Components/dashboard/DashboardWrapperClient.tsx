/** @format */

"use client"

import dynamic from "next/dynamic"
import DashboardLoadingSkeleton from "../common/DashboardLoadingSkeleton"


const DashboardWrapper = dynamic(() => import("./DashboardWrapper"), {
  loading: () => <DashboardLoadingSkeleton />,
  ssr: false,
})

export default function DashboardWrapperClient() {
  return <DashboardWrapper />
}
