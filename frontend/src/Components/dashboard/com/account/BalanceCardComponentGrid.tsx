/** @format */
"use client"

import { Suspense } from "react"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { Skeleton } from "@/Components/ui/skeleton"
import { AccountSelector } from "./AccountSelector"
import { Card, CardSkeleton } from "./Card"


// Create a separate component for AccountSelector with Suspense
const AccountSelectorWithSuspense = () => {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-48 rounded-md" />}>
      <AccountSelector />
    </Suspense>
  )
}

export const BalanceCardComponent = () => {
  const { selectedAccount } = useAppSelector((state) => state.account)

  const cards = [
    {
      title: "Total Balance",
      value: selectedAccount?.balance,
      trend: "5.2% from last month",
      icon: "balance",
      gradient: "from-blue-50 to-blue-100",
      colors: {
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        trendColor: "text-blue-600",
      },
    },
    {
      title: "Total Income",
      value: selectedAccount?.income,
      trend: "12.5% from last month",
      icon: "income",
      gradient: "from-green-50 to-green-100",
      colors: {
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        trendColor: "text-green-600",
      },
    },
    {
      title: "Total Expense",
      value: selectedAccount?.totalExpense,
      trend: "3.8% from last month",
      icon: "expense",
      gradient: "from-purple-50 to-purple-100",
      colors: {
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        trendColor: "text-purple-600",
      },
    },
  ]

  return (
    <div className="w-full mt-10 px-4 sm:px-6 lg:px-8 gap-4">
      <div className="w-full flex flex-col justify-end items-end mb-6">
        <AccountSelectorWithSuspense />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-7xl w-full mx-auto">
        <Suspense
          fallback={
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          }>
          {cards.map((card, index) => (
            <Card
              key={index}
              title={card.title}
              value={card.value}
              trend={card.trend}
              icon={card.icon}
              gradient={card.gradient}
              {...card.colors}
            />
          ))}
        </Suspense>
      </div>
    </div>
  )
}
