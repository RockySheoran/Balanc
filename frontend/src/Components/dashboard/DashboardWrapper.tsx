/** @format */
"use client"

import React, { Suspense, lazy } from "react"
import type { Session } from "next-auth"

// Lazy load components
const BalanceCardComponent = lazy(() =>
  import("./com/account/BalanceCardComponentGrid").then((mod) => ({
    default: mod.BalanceCardComponent,
  }))
)

const RecentTransaction = lazy(() =>
  import("./com/recentTransaction").then((mod) => ({
    default: mod.RecentTransaction,
  }))
)

const ExpenseTracker = lazy(() =>
  import("./com/ExpenseTracker").then((mod) => ({
    default: mod.ExpenseTracker,
  }))
)

const IncomeDashboard = lazy(() =>
  import("./com/IncomeDashboard").then((mod) => ({
    default: mod.default,
  }))
)

const InvestmentTracker = lazy(() =>
  import("./com/InvestmentTracker").then((mod) => ({
    default: mod.default,
  }))
)



export default function DashboardWrapper() {
  return (
    <div className="dashboard px-2 bg-gray-50">
      <div className="mx-auto py-6 ">
        <Suspense fallback={<Skeleton height="h-48" />}>
          <BalanceCardComponent />
        </Suspense>

        <Suspense fallback={<Skeleton height="h-64" />}>
          <RecentTransaction />
        </Suspense>

        <Suspense fallback={<Skeleton height="h-48" />}>
          <ExpenseTracker />
        </Suspense>

        <Suspense fallback={<Skeleton height="h-96" />}>
          <IncomeDashboard />
        </Suspense>

        <Suspense fallback={<Skeleton height="h-96" />}>
          <InvestmentTracker />
        </Suspense>
      </div>
    </div>
  )
}

// Reusable skeleton component
function Skeleton({ height }: { height: string }) {
  return <div className={`${height} bg-gray-200 rounded-lg animate-pulse`} />
}
