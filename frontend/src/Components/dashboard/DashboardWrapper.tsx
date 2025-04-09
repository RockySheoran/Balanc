/** @format */
"use client"

import React, { Suspense, lazy, useMemo } from "react"
import { BalanceCardComponent } from "./com/account/BalanceCardComponentGrid"
import { RecentTransaction } from "./com/recentTransaction"
import { ExpenseTracker } from "./com/ExpenseTracker"
import IncomeDashboard from "./com/IncomeDashboard"
import InvestmentTracker from "./com/InvestmentTracker"

// Lazy imports (with memoized fallback to avoid remounting skeletons)
// const BalanceCardComponent = lazy(() =>
//   import("./com/account/BalanceCardComponentGrid").then((mod) => ({
//     default: mod.BalanceCardComponent,
//   }))
// )


// const RecentTransaction = lazy(() =>
//   import("./com/recentTransaction").then((mod) => ({
//     default: mod.RecentTransaction,
//   }))
// )

// const ExpenseTracker = lazy(() =>
//   import("./com/ExpenseTracker").then((mod) => ({
//     default: mod.ExpenseTracker,
//   }))
// )

// const IncomeDashboard = lazy(() =>
//   import("./com/IncomeDashboard").then((mod) => ({
//     default: mod.default,
//   }))
// )

// const InvestmentTracker = lazy(() =>
//   import("./com/InvestmentTracker").then((mod) => ({
//     default: mod.default,
//   }))
// )

// Reusable skeleton fallback (memoized to avoid re-renders)
const useSkeleton = (height: string) =>
  useMemo(() => <Skeleton height={height} />, [height])

export default function DashboardWrapper() {
  return (
    <div className="dashboard px-2 bg-gray-50">
      <div className="mx-auto py-6 space-y-6">

        <Suspense fallback={useSkeleton("h-64")}>
          <BalanceCardComponent />
       
        </Suspense>

        <Suspense fallback={useSkeleton("h-64")}>
          <RecentTransaction />
        </Suspense>

        <Suspense fallback={useSkeleton("h-48")}>
          <ExpenseTracker />
        </Suspense>

        <Suspense fallback={useSkeleton("h-96")}>
          <IncomeDashboard />
        </Suspense>

        <Suspense fallback={useSkeleton("h-96")}>
          <InvestmentTracker />
        </Suspense>
      </div>
    </div>
  )
}

function Skeleton({ height }: { height: string }) {
  return <div className={`${height} bg-gray-200 rounded-lg animate-pulse`} />
}
