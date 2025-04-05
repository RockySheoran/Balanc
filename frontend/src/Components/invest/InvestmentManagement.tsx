/** @format */
"use client"
import { addInvestment, fetchStockPrice, selectInvestment, setFilter } from "@/lib/Redux/features/investmentSlice/investmentSlice"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import React, { useEffect, useState } from "react"

// Define the Filters type if not already defined elsewhere
type Filters = {
  dateRange: "all" | "1m" | "3m" | "6m" | "1y"
  performanceFilter: "all" | "profit" | "loss" | "best"
  searchTerm: string
}
import { Investment } from "./investment"
import SummaryCards from "./SummaryCards"
import PerformanceChart from "./PerformanceChart"
import InvestmentTable from "./InvestmentTable"
import InvestmentForm from "./InvestmentForm"



const InvestmentManagement: React.FC = () => {
  const dispatch = useAppDispatch()
  const { investments, status, filters } = useAppSelector(
    (state) => state.investments
  )
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    // Fetch current prices for all investments periodically
    const interval = setInterval(() => {
      investments.forEach((inv) => {
        dispatch(fetchStockPrice(inv.symbol))
      })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [investments, dispatch])

  const filteredInvestments = investments?.filter((inv) => {
    // Apply filters
    const matchesSearch =
      inv.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      inv.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase())

    let matchesPerformance = true
    if (filters.performanceFilter === "profit") {
      matchesPerformance = inv.currentPrice
        ? inv.currentPrice > inv.buyPrice
        : false
    } else if (filters.performanceFilter === "loss") {
      matchesPerformance = inv.currentPrice
        ? inv.currentPrice < inv.buyPrice
        
        : false
    } else if (filters.performanceFilter === "best") {
      // Sort by ROI and take top 25%
      const sorted = [...investments].sort((a, b) => {
        const aROI = a.currentPrice
          ? (a.currentPrice - a.buyPrice) / a.buyPrice
          : 0
        const bROI = b.currentPrice
          ? (b.currentPrice - b.buyPrice) / b.buyPrice
          : 0
        return bROI - aROI
      })
      const top25 = sorted.slice(0, Math.ceil(sorted.length * 0.25))
      matchesPerformance = top25.some((topInv) => topInv.id === inv.id)
    }

    return matchesSearch && matchesPerformance
  })

  const handleAddInvestment = (
    investment: Omit<Investment, "id" | "currentPrice">
  ) => {
    dispatch(addInvestment(investment))
    setIsFormOpen(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Investment Portfolio
      </h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border rounded-lg bg-white"
            value={filters.dateRange}
            onChange={(e) =>
              dispatch(
                setFilter({ dateRange: e.target.value as Filters["dateRange"] })
              )
            }>
            <option value="all">All Time</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg bg-white"
            value={filters.performanceFilter}
            onChange={(e) =>
              dispatch(
                setFilter({
                  performanceFilter: e.target
                    .value as Filters["performanceFilter"],
                })
              )
            }>
            <option value="all">All Investments</option>
            <option value="profit">Profitable</option>
            <option value="loss">Losing</option>
            <option value="best">Top Performers</option>
          </select>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          + Add Investment
        </button>
      </div>

      <SummaryCards investments={filteredInvestments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          {/* <PerformanceChart investments={filteredInvestments} /> */}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
          {/* Mini leaderboard component would go here */}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <InvestmentTable
          investments={filteredInvestments}
          onSelect={(id) => dispatch(selectInvestment(id))}
        />
      </div>

      {isFormOpen && (
        <InvestmentForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddInvestment}
          isLoading={status === "loading"}
        />
      )}
    </div>
  )
}

export default InvestmentManagement
