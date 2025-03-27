/** @format */

// Components/dashboard/DashboardWrapper.tsx
"use client"

import { Session } from "next-auth"
import React, { useState } from "react"
import DashboardClient from "./DashboardClient"
import { SideBar } from "./com/SideBar"
import { BalanceCardComponent } from "./com/BalanceCardComponentGrid"
import { RecentTransaction } from "./com/recentTransaction"

import {ExpenseTracker } from "./com/ExpenseTracker"

interface SessionProps {
    session: Session | any
}
export default function DashboardWrapper({ session }:SessionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="dashboard">
      <DashboardClient session={session} />
      <div className="flex">
        <SideBar
          session={session}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <div className={`${isCollapsed ? " " : ""} w-full`}>
          <BalanceCardComponent />
          <RecentTransaction />
          <ExpenseTracker />
        </div>
      </div>
    </div>
  )
}
