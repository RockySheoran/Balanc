/** @format */
import React from "react"
import { Badge } from "@/Components/ui/badge"
import { Card, CardHeader, CardContent } from "@/Components/ui/card"
import { ArrowUp, ArrowDown, Star, TrendingUp, Trophy } from "lucide-react"
import { Investment } from "./investment"

interface TopPerformersProps {
  investments: Investment[]
  count?: number
  className?: string
}

const TopPerformers: React.FC<TopPerformersProps> = ({
  investments,
  count = 5,
  className = "",
}) => {
  // Memoized calculation of top performing investments
  const { sortedInvestments, averageRoi, performanceTrend, totals } =
    React.useMemo(() => {
      if (!investments || investments.length === 0) {
        return {
          sortedInvestments: [],
          averageRoi: 0,
          performanceTrend: "neutral",
          totals: { value: 0, gain: 0 },
        }
      }

      // Calculate ROI and sort
      const withRoi = investments.map((inv) => {
        const currentValue = inv.currentPrice || inv.buyPrice
        const roi = ((currentValue - inv.buyPrice) / inv.buyPrice) * 100
        const value = currentValue * inv.quantity
        const gain = (currentValue - inv.buyPrice) * inv.quantity
        return { ...inv, roi, value, gain }
      })

      const sorted = [...withRoi].sort((a, b) => b.roi - a.roi).slice(0, count)

      // Calculate averages and totals
      const avgRoi =
        sorted.reduce((sum, inv) => sum + inv.roi, 0) / sorted.length
      const totalValue = sorted.reduce((sum, inv) => sum + inv.value, 0)
      const totalGain = sorted.reduce((sum, inv) => sum + inv.gain, 0)

      // Determine trend
      let trend: "improving" | "declining" | "neutral" = "neutral"
      if (sorted.length >= 2) {
        const first = sorted[0].roi
        const last = sorted[sorted.length - 1].roi
        trend =
          first - last > 5
            ? "improving"
            : first - last < -5
            ? "declining"
            : "neutral"
      }

      return {
        sortedInvestments: sorted,
        averageRoi: avgRoi,
        performanceTrend: trend,
        totals: {
          value: totalValue,
          gain: totalGain,
        },
      }
    }, [investments, count])

  // Format currency based on investment type (simplified)
  const formatCurrency = (value: number, symbol = "$") => {
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Medal colors for top 3 performers
  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
      case 1:
        return "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
      case 2:
        return "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  if (sortedInvestments.length === 0) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-4 h-4" />
            Top Performers
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No investment data available
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Top Performers
          </h3>
          <Badge
            variant={
              averageRoi > 5
                ? "default"
                : averageRoi < -5
                ? "destructive"
                : "secondary"
            }
            className="flex items-center gap-1">
            {averageRoi.toFixed(1)}%
            {performanceTrend === "improving" ? (
              <ArrowUp className="w-3 h-3" />
            ) : performanceTrend === "declining" ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sortedInvestments.slice(0,4).map((investment, index) => {
            const isPositive = investment.roi > 0
            const isNegative = investment.roi < 0
            const currencySymbol = investment.symbol.includes(".NS") ? "₹" : "$"

            return (
              <div
                key={`${investment.id}-${index}`}
                className="flex items-center justify-between group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankColor(
                      index
                    )} font-medium`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{investment.symbol}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {investment.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end ml-2">
                  <Badge
                    variant={
                      isPositive
                        ? "default"
                        : isNegative
                        ? "destructive"
                        : "secondary"
                    }
                    className="px-2 py-1 text-xs">
                    {investment.roi > 0 ? "+" : ""}
                    {investment.roi.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(investment.value, currencySymbol)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2 pt-3 border-t">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Value:</span>
            <span className="text-sm font-medium">
              {formatCurrency(totals.value)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Gain:</span>
            <span
              className={`text-sm font-medium ${
                totals.gain > 0
                  ? "text-green-600"
                  : totals.gain < 0
                  ? "text-red-600"
                  : ""
              }`}>
              {totals.gain > 0 ? "+" : ""}
              {formatCurrency(totals.gain)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(TopPerformers)
