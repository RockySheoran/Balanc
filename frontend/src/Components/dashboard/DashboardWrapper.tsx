/** @format */

// Components/dashboard/DashboardWrapper.tsx
"use client"

import { Session } from "next-auth"
import React, { useState } from "react"

import { BalanceCardComponent } from "./com/account/BalanceCardComponentGrid"
import { RecentTransaction } from "./com/recentTransaction"

import {ExpenseTracker } from "./com/ExpenseTracker"
import IncomeDashboard from "./com/IncomeDashboard"
import InvestmentTracker from "./com/InvestmentTracker"


export default function DashboardWrapper() {
  

  return (
    <div className="dashboard">
      
      <div className="flex">
       
        <div className={` w-full`}>
          <BalanceCardComponent />
          <RecentTransaction />
          <ExpenseTracker />
          <IncomeDashboard/>
          <InvestmentTracker/>
        </div>
      </div>
    </div>
  )
}
