/** @format */
"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js"
import { motion } from "framer-motion"
import {
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi"
import { Skeleton } from "@/Components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { Button } from "@/Components/ui/button"
import { toast } from "sonner"
import { Investment } from "@/Components/invest/investment"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import axios from "axios"
import { Stock_API_URL, Stock_API_URL1 } from "@/lib/EndPointApi"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
)

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  bestPerformer: Investment | null
  worstPerformer: Investment | null
}

const COLOR_PALETTE = [
  "#3e95cd",
  "#8e5ea2",
  "#3cba9f",
  "#e8c3b9",
  "#c45850",
  "#4dc9f6",
  "#f67019",
  "#f53794",
  "#537bc4",
  "#acc236",
  "#166a8f",
  "#00a950",
  "#58595b",
  "#8549ba",
]

const InvestmentTracker = () => {
  const investments = useAppSelector((state) => state.investment.investments)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [timeRange, setTimeRange] = useState<
    "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y"
  >("1mo")
  const [interval, setInterval] = useState<"1d" | "1wk" | "1mo">("1d")
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  // Get top 5 investments by value (quantity * buy price)
  const topInvestments = useMemo(() => {
    return [...investments]
      .sort((a, b) => b.buyPrice * b.quantity - a.buyPrice * a.quantity)
      .slice(0, 5)
  }, [investments])

  const rangeOptions = useMemo(
    () => [
      { value: "1d", label: "1 Day" },
      { value: "5d", label: "5 Days" },
      { value: "1mo", label: "1 Month" },
      { value: "3mo", label: "3 Months" },
      { value: "6mo", label: "6 Months" },
      { value: "1y", label: "1 Year" },
    ],
    []
  )

  const intervalOptions = useMemo(
    () => [
      { value: "1d", label: "1 Day" },
      { value: "1wk", label: "1 Week" },
      { value: "1mo", label: "1 Month" },
    ],
    []
  )

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Portfolio calculations
  const calculateSummary = useCallback((investments: Investment[]) => {
    const topInvestments = [...investments]
      .sort((a, b) => b.buyPrice * b.quantity - a.buyPrice * a.quantity)
      .slice(0, 5)

    const totalInvested = topInvestments.reduce(
      (sum, investment) => sum + investment.buyPrice * investment.quantity,
      0
    )

    const currentValue = topInvestments.reduce(
      (sum, investment) =>
        sum +
        (investment.currentValue || investment.buyPrice) * investment.quantity,
      0
    )

    const profitLoss = currentValue - totalInvested
    const profitLossPercentage = (profitLoss / totalInvested) * 100

    const performers = topInvestments
      .map((investment) => ({
        ...investment,
        performance:
          (((investment.currentValue || investment.buyPrice) -
            investment.buyPrice) /
            investment.buyPrice) *
          100,
      }))
      .sort((a, b) => b.performance - a.performance)

    setSummary({
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercentage,
      bestPerformer: performers[0] || null,
      worstPerformer: performers[performers.length - 1] || null,
    })
  }, [])

  // Fetch stock data using Yahoo Finance API
  const fetchStockChartData = useCallback(
    async (symbol: string) => {
      try {
        console.log(process.env.X_RAPIDAPI1)
        const options = {
          method: "GET",
          url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart",
          params: {
            region: symbol.includes(".NS") ? "IN" : "US",
            symbol,
            range: timeRange,
            interval,
          },
          headers: {
            "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI1,
            "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
          },
        }

        const response = await axios.request(options)

        if (!response.data?.chart?.result?.[0]) {
          throw new Error(`No data received for ${symbol}`)
        }

        return response.data
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err)
        return null
      }
    },
    [timeRange, interval]
  )

  // Fetch all data with error handling
  const fetchAllData = useCallback(async () => {
    if (topInvestments.length === 0) return

    try {
      setLoading(true)
      setApiError(null)

      const allData = await Promise.all(
        topInvestments.map((inv) => fetchStockChartData(inv.symbol))
      )

      const validData = allData.filter(Boolean)

      if (validData.length === 0) {
        throw new Error("No valid chart data received for any investments")
      }

      setChartData(validData)
      calculateSummary(investments)
      setLastUpdated(new Date().toISOString())
      toast.success("Portfolio data updated successfully")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load portfolio data"
      setApiError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [topInvestments, fetchStockChartData, calculateSummary, investments])

  // Initial data load
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Chart data preparation
  const lineChartData = useMemo(() => {
    if (chartData.length === 0) return { labels: [], datasets: [] }

    const referenceTimestamps =
      chartData[0]?.chart?.result?.[0]?.timestamp || []

    const formatChartDate = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      switch (timeRange) {
        case "1d":
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        case "5d":
        case "1mo":
          return date.toLocaleDateString([], { month: "short", day: "numeric" })
        case "3mo":
        case "6mo":
          return date.toLocaleDateString([], { month: "short" })
        default:
          return date.toLocaleDateString([], {
            year: "numeric",
            month: "short",
          })
      }
    }

    return {
      labels: referenceTimestamps.map(formatChartDate),
      datasets: chartData.map((data, index) => {
        const result = data.chart.result[0]
        const meta = result.meta
        const quotes = result.indicators.quote[0]
        const inv =
          topInvestments.find((i) => i.symbol === meta.symbol) ||
          topInvestments[index]

        return {
          label: `${meta.symbol} - ${meta.shortName.substring(0, 15)}${
            meta.shortName.length > 15 ? "..." : ""
          }`,
          data: quotes.close,
          borderColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
          backgroundColor: `${COLOR_PALETTE[index % COLOR_PALETTE.length]}20`,
          borderWidth: 2,
          pointRadius: timeRange === "1d" ? 3 : 0,
          pointHoverRadius: 5,
          tension: 0.1,
          fill: {
            target: "origin",
            above: `${COLOR_PALETTE[index % COLOR_PALETTE.length]}10`,
          },
        }
      }),
    }
  }, [chartData, topInvestments, timeRange])

  const pieChartData = useMemo(
    () => ({
      labels: topInvestments.map((investment) => investment.symbol),
      datasets: [
        {
          data: topInvestments.map(
            (investment) =>
              (investment.currentValue || investment.buyPrice) *
              investment.quantity
          ),
          backgroundColor: topInvestments.map(
            (_, index) => COLOR_PALETTE[index % COLOR_PALETTE.length]
          ),
          borderWidth: 1,
        },
      ],
    }),
    [topInvestments]
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            boxWidth: 12,
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || ""
              const value = context.raw || 0
              return `${label}: ${formatCurrency(value)}`
            },
          },
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    []
  )

  const handleRefresh = useCallback(() => {
    fetchAllData()
  }, [fetchAllData])

  const handleRangeChange = useCallback((value: string) => {
    setTimeRange(value as any)
    // Auto-adjust interval based on range
    if (value === "1d") {
      setInterval("1d")
    } else if (value === "5d") {
      setInterval("1d")
    } else {
      setInterval("1wk")
    }
  }, [])

  if (loading && topInvestments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (topInvestments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 text-lg mb-4">No investments found</p>
        <Button onClick={fetchAllData} variant="outline">
          <FiRefreshCw className="mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header and refresh button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Investment Portfolio
        </h1>
        <div className="flex items-center mt-4 md:mt-0">
          {lastUpdated && (
            <p className="text-sm text-gray-500 mr-4">
              Last updated: {formatTime(lastUpdated)}
            </p>
          )}
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2">
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiRefreshCw />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{apiError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Invested */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Total Invested</h3>
            <div className="p-2 rounded-full bg-blue-50 text-blue-500">
              <FiDollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {summary ? formatCurrency(summary.totalInvested) : "--"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Top 5 investments by value
          </p>
        </motion.div>

        {/* Current Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Current Value</h3>
            <div className="p-2 rounded-full bg-green-50 text-green-500">
              <FiTrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {summary ? formatCurrency(summary.currentValue) : "--"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {summary ? formatPercentage(summary.profitLossPercentage) : "--"}{" "}
            overall
          </p>
        </motion.div>

        {/* Profit/Loss */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`bg-white rounded-xl shadow-md p-6 border ${
            summary?.profitLoss && summary.profitLoss >= 0
              ? "border-green-100"
              : "border-red-100"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Profit/Loss</h3>
            <div
              className={`p-2 rounded-full ${
                summary?.profitLoss && summary.profitLoss >= 0
                  ? "bg-green-50 text-green-500"
                  : "bg-red-50 text-red-500"
              }`}>
              {summary?.profitLoss && summary.profitLoss >= 0 ? (
                <FiTrendingUp size={20} />
              ) : (
                <FiTrendingDown size={20} />
              )}
            </div>
          </div>
          <div className="flex items-end mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {summary ? formatCurrency(summary.profitLoss) : "--"}
            </p>
            <span
              className={`ml-2 text-sm font-medium ${
                summary?.profitLossPercentage &&
                summary.profitLossPercentage >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}>
              {summary ? formatPercentage(summary.profitLossPercentage) : "--"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {summary?.profitLoss && summary.profitLoss >= 0 ? "Profit" : "Loss"}
          </p>
        </motion.div>

        {/* Best Performer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Performance</h3>
            <div className="p-2 rounded-full bg-purple-50 text-purple-500">
              <FiArrowUp size={20} />
            </div>
          </div>
          {summary?.bestPerformer ? (
            <div className="mt-2">
              <p className="text-xl font-bold">
                {summary.bestPerformer.symbol}
              </p>
              <p className="text-sm text-gray-500">
                {summary.bestPerformer.name.substring(0, 15)}
                {summary.bestPerformer.name.length > 15 ? "..." : ""}
              </p>
              <p className="text-green-500 font-medium mt-1">
                +
                {(
                  (((summary.bestPerformer.currentValue ||
                    summary.bestPerformer.buyPrice) -
                    summary.bestPerformer.buyPrice) /
                    summary.bestPerformer.buyPrice) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
          ) : (
            <p className="text-gray-500 mt-2">--</p>
          )}
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Top 5 Holdings Performance
            </h3>
            <div className="flex space-x-2">
              <Select value={timeRange} onValueChange={handleRangeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  {rangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-80">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Allocation Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top 5 Holdings Allocation
          </h3>
          <div className="h-80">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Your Top 5 Holdings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P/L
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topInvestments.map((investment) => {
                const invested = investment.buyPrice * investment.quantity
                const currentValue =
                  (investment.currentValue || investment.buyPrice) *
                  investment.quantity
                const profitLoss = currentValue - invested
                const profitLossPercentage = (profitLoss / invested) * 100

                return (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {investment.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {investment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(investment.buyDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatCurrency(investment.buyPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {investment.currentValue
                        ? formatCurrency(investment.currentValue)
                        : "--"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {investment.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatCurrency(invested)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(currentValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`flex items-center ${
                          profitLoss >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                        {profitLoss >= 0 ? (
                          <FiArrowUp className="mr-1" />
                        ) : (
                          <FiArrowDown className="mr-1" />
                        )}
                        {formatCurrency(profitLoss)} (
                        {formatPercentage(profitLossPercentage)})
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default InvestmentTracker
