/** @format */
"use client"
import React from "react"
import { Investment } from "./investment"

interface SummaryCardsProps {
  investments: Investment[]
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ investments }) => {
  const totalInvested = investments?.reduce(
    (sum, inv) => sum + inv.buyPrice * inv.quantity,
    0
  )
  const currentValue = investments?.reduce(
    (sum, inv) => sum + (inv.currentPrice || inv.buyPrice) * inv.quantity,
    0
  )
  const profitLoss = currentValue - totalInvested
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

  const bestPerformer = investments?.reduce((best, inv) => {
    if (!inv.currentPrice) return best
    const currentROI = ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100
    return !best || currentROI > best.roi
      ? { symbol: inv.symbol, roi: currentROI }
      : best
  }, null as { symbol: string; roi: number } | null)

  const worstPerformer = investments?.reduce((worst, inv) => {
    if (!inv.currentPrice) return worst
    const currentROI = ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100
    return !worst || currentROI < worst.roi
      ? { symbol: inv.symbol, roi: currentROI }
      : worst
  }, null as { symbol: string; roi: number } | null)

  // Format currency with commas
  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Invested Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-80">Total Invested</h3>
            <p className="text-3xl font-bold mt-2">
              ${formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm opacity-80">
            Across {investments?.length || 0} investments
          </p>
        </div>
      </div>

      {/* Current Value Card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-80">Current Value</h3>
            <p className="text-3xl font-bold mt-2">
              ${formatCurrency(currentValue)}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm opacity-80">
            {roi >= 0 ? "↑" : "↓"} {Math.abs(roi).toFixed(2)}% overall
          </p>
        </div>
      </div>

      {/* Profit/Loss Card */}
      <div
        className={`p-6 rounded-2xl shadow-lg text-white ${
          profitLoss >= 0
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-red-500 to-red-600"
        }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-80">Profit/Loss</h3>
            <p className="text-3xl font-bold mt-2">
              {profitLoss >= 0 ? "+" : ""}${formatCurrency(profitLoss)}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            {profitLoss >= 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm opacity-80">
            {roi >= 0 ? "Profit" : "Loss"} of {Math.abs(roi).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Performance Card */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium opacity-80">Performance</h3>
            <div className="mt-2">
              {bestPerformer ? (
                <div className="mb-2">
                  <p className="text-xl font-bold">
                    {bestPerformer.symbol}{" "}
                    <span className="text-green-200">
                      +{bestPerformer.roi.toFixed(2)}%
                    </span>
                  </p>
                  <p className="text-xs opacity-80">Best Performer</p>
                </div>
              ) : (
                <p className="text-xl font-bold">N/A</p>
              )}
              {worstPerformer && (
                <div>
                  <p className="text-xl font-bold">
                    {worstPerformer.symbol}{" "}
                    <span className="text-red-200">
                      {worstPerformer.roi.toFixed(2)}%
                    </span>
                  </p>
                  <p className="text-xs opacity-80">Worst Performer</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryCards
