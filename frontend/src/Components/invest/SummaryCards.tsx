/** @format */
"use client"
import React, { useMemo } from "react"
import { Investment } from "./investment"

interface SummaryCardsProps {
  investments: Investment[]
}

interface Performer {
  symbol: string
  roi: number
}

const formatCurrency = (value: number) => {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const SummaryCard = ({
  title,
  value,
  icon,
  footer,
  gradientFrom,
  gradientTo,
}: {
  title: string
  value: React.ReactNode
  icon: React.ReactNode
  footer?: React.ReactNode
  gradientFrom: string
  gradientTo: string
}) => (
  <div
    className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-6 rounded-2xl shadow-lg text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <div className="text-3xl font-bold mt-2">{value}</div>
      </div>
      <div className="bg-white/20 p-3 rounded-full">{icon}</div>
    </div>
    {footer && (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-sm opacity-80">{footer}</p>
      </div>
    )}
  </div>
)

const PerformanceCard = ({
  bestPerformer,
  worstPerformer,
}: {
  bestPerformer: Performer | null
  worstPerformer: Performer | null
}) => {
  const ChartIcon = (
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
  )

  return (
    <SummaryCard
      title="Performance"
      value={
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
      }
      icon={ChartIcon}
      gradientFrom="from-amber-500"
      gradientTo="to-amber-600"
    />
  )
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ investments = [] }) => {
  const {
    totalInvested,
    currentValue,
    profitLoss,
    roi,
    bestPerformer,
    worstPerformer,
  } = useMemo(() => {
    const total = investments.reduce(
      (sum, inv) => sum + inv.buyPrice * inv.quantity,
      0
    )
    const current = investments.reduce(
      (sum, inv) => sum + (inv.currentPrice || inv.buyPrice) * inv.quantity,
      0
    )
    const profit = current - total
    const returnOnInvestment = total > 0 ? (profit / total) * 100 : 0

    const best = investments.reduce((best, inv) => {
      if (!inv.currentPrice) return best
      const currentROI =
        ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100
      return !best || currentROI > best.roi
        ? { symbol: inv.symbol, roi: currentROI }
        : best
    }, null as Performer | null)

    const worst = investments.reduce((worst, inv) => {
      if (!inv.currentPrice) return worst
      const currentROI =
        ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100
      return !worst || currentROI < worst.roi
        ? { symbol: inv.symbol, roi: currentROI }
        : worst
    }, null as Performer | null)

    return {
      totalInvested: total,
      currentValue: current,
      profitLoss: profit,
      roi: returnOnInvestment,
      bestPerformer: best,
      worstPerformer: worst,
    }
  }, [investments])

  const MoneyIcon = (
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
  )

  const ChartUpIcon = (
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
  )

  const ProfitLossIcon =
    profitLoss >= 0 ? (
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
    )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Total Invested"
        value={`$${formatCurrency(totalInvested)}`}
        icon={MoneyIcon}
        footer={`Across ${investments.length} investments`}
        gradientFrom="from-blue-500"
        gradientTo="to-blue-600"
      />

      <SummaryCard
        title="Current Value"
        value={`$${formatCurrency(currentValue)}`}
        icon={ChartUpIcon}
        footer={`${roi >= 0 ? "↑" : "↓"} ${Math.abs(roi).toFixed(2)}% overall`}
        gradientFrom="from-purple-500"
        gradientTo="to-purple-600"
      />

      <SummaryCard
        title="Profit/Loss"
        value={`${profitLoss >= 0 ? "+" : ""}$${formatCurrency(profitLoss)}`}
        icon={ProfitLossIcon}
        footer={`${roi >= 0 ? "Profit" : "Loss"} of ${Math.abs(roi).toFixed(
          2
        )}%`}
        gradientFrom={profitLoss >= 0 ? "from-green-500" : "from-red-500"}
        gradientTo={profitLoss >= 0 ? "to-green-600" : "to-red-600"}
      />

      <PerformanceCard
        bestPerformer={bestPerformer}
        worstPerformer={worstPerformer}
      />
    </div>
  )
}

export default SummaryCards
