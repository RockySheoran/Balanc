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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
        <p className="text-2xl font-semibold">${totalInvested?.toFixed(2)}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Current Value</h3>
        <p className="text-2xl font-semibold">${currentValue?.toFixed(2)}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Profit/Loss</h3>
        <p
          className={`text-2xl font-semibold ${
            profitLoss >= 0 ? "text-green-600" : "text-red-600"
          }`}>
          ${profitLoss.toFixed(2)} ({roi?.toFixed(2)}%)
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Best Performer</h3>
        <p className="text-2xl font-semibold">
          {bestPerformer
            ? `${bestPerformer.symbol} (${bestPerformer?.roi?.toFixed(2)}%)`
            : "N/A"}
        </p>
        <p className="text-sm text-gray-500">
          {worstPerformer &&
            `Worst: ${worstPerformer.symbol} (${worstPerformer?.roi?.toFixed(
              2
            )}%)`}
        </p>
      </div>
    </div>
  )
}

export default SummaryCards
