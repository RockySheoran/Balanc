/** @format */
"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { Skeleton } from "@/Components/ui/skeleton"
import { Card } from "./Card"
import { AccountSelectorSkeleton } from "@/Components/ui/AccountSkeleton"

// import { AccountSelector } from "./AccountSelector"


// Lazy load AccountSelector (actual performance gain)
const AccountSelector = dynamic(() => import("./AccountSelector").then((mod) => mod.AccountSelector),
  {
    loading: () =>  <div className="min-h-[400px]">
    <AccountSelectorSkeleton />
  </div>,
    // loading:()=><div className=""><h1 className="text-4xl">Loadingn</h1></div>,
    ssr: false,
  }
)

export const BalanceCardComponent = () => {
  const { selectedAccount } = useAppSelector((state) => state.account)
  // console.log(selectedAccount)
  const cards = useMemo(() => {
    if (!selectedAccount) return []

    return [
      {
        title: "Total Balance",
        value: selectedAccount.balance,
        
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
        value: selectedAccount.income,
       
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
        value: selectedAccount.totalExpense,
    
        icon: "expense",
        gradient: "from-purple-50 to-purple-100",
        colors: {
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          trendColor: "text-purple-600",
        },
      },
    ]
  }, [selectedAccount])

  return (
    <div className="mt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="w-full flex justify-end mb-6">
        <Suspense>
          <AccountSelector />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            title={card.title}
            value={card.value}
            
            icon={card.icon}
            gradient={card.gradient}
            {...card.colors}
          />
        ))}
      </div>
    </div>
  )
}
const useSkeleton = (height: string) =>useMemo(() => <Skeleton1 height={height} />, [height])


function Skeleton1({ height }: { height: string }) {
  return <div className={`${height} bg-gray-200 rounded-lg animate-pulse`} />
}
