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
import { Stock_API_URL1 } from "@/lib/EndPointApi"
import { format, formatDistanceToNow } from "date-fns"

// Register ChartJS components once
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

// Constants
const COLOR_PALETTE = [
  "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850",
  "#4dc9f6", "#f67019", "#f53794", "#537bc4", "#acc236",
  "#166a8f", "#00a950", "#58595b", "#8549ba"
]

const RANGE_OPTIONS = [
  { value: "1d", label: "1 Day" },
  { value: "5d", label: "5 Days" },
  { value: "1mo", label: "1 Month" },
  { value: "3mo", label: "3 Months" },
  { value: "6mo", label: "6 Months" },
  { value: "1y", label: "1 Year" },
] as const

const INTERVAL_OPTIONS = [
  { value: "1d", label: "1 Day" },
  { value: "1wk", label: "1 Week" },
  { value: "1mo", label: "1 Month" },
] as const

type TimeRange = typeof RANGE_OPTIONS[number]['value']
type Interval = typeof INTERVAL_OPTIONS[number]['value']

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  bestPerformer: Investment | null
  worstPerformer: Investment | null
}

const InvestmentTracker = () => {
  // State
  const investments = useAppSelector((state) => state.investment.investments)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("1mo")
  const [interval, setInterval] = useState<Interval>("1d")
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  // Memoized derived values
  const topInvestments = useMemo(() => 
    [...investments]
      .sort((a, b) => b.buyPrice * b.quantity - a.buyPrice * a.quantity)
      .slice(0, 5),
    [investments]
  )

  // Formatting utilities
  const formatCurrency = useCallback((amount: number) => 
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount),
    []
  )

  const formatPercentage = useCallback((value: number) => 
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
    []
  )

  // Portfolio calculations (unchanged logic)
  const calculateSummary = useCallback((investments: Investment[]) => {
    const totalInvested = investments.reduce(
      (sum, investment) => sum + investment.buyPrice * investment.quantity,
      0
    )

    const currentValue = investments.reduce(
      (sum, investment) =>
        sum + (investment.currentValue || investment.buyPrice) * investment.quantity,
      0
    )

    const profitLoss = currentValue - totalInvested
    const profitLossPercentage = (profitLoss / totalInvested) * 100

    const performers = investments
      .map((investment) => ({
        ...investment,
        performance: (
          ((investment.currentValue || investment.buyPrice) - investment.buyPrice) / 
          investment.buyPrice * 100
        )
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

  // Data fetching (unchanged logic)
  const fetchStockChartData = useCallback(async (symbol: string) => {
    try {
      const response = await axios.get(`${Stock_API_URL1}/api/stock/get-chart`, {
        params: {
          symbol,
          range: timeRange,
          interval,
          region: symbol.includes(".NS") ? "IN" : "US",
        },
        headers: {
          "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI1,
          "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
        },
      })

      if (!response.data?.chart?.result?.[0]) {
        throw new Error(`No data received for ${symbol}`)
      }
      return response.data
    } catch (err) {
      // toast.error(`Error fetching data for ${symbol}`)
      return null
    }
  }, [timeRange, interval])

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
        throw new Error("No valid chart data received and free api request completed")
      }

      setChartData(validData)
      calculateSummary(topInvestments)
      setLastUpdated(new Date())
      toast.success("Portfolio updated")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setApiError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [topInvestments, fetchStockChartData, calculateSummary])

  // Initial data load
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Chart data preparation (optimized)
  const lineChartData = useMemo(() => {
    if (chartData.length === 0) return { labels: [], datasets: [] }

    const referenceTimestamps = chartData[0]?.chart?.result?.[0]?.timestamp || []
    
    const formatLabel = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      switch (timeRange) {
        case "1d": return format(date, "HH:mm")
        case "5d": 
        case "1mo": return format(date, "MMM dd")
        case "3mo":
        case "6mo": return format(date, "MMM")
        default: return format(date, "MMM yyyy")
      }
    }

    return {
      labels: referenceTimestamps.map(formatLabel),
      datasets: chartData.map((data, index) => {
        const result = data.chart.result[0]
        const meta = result.meta
        const quotes = result.indicators.quote[0]
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

        return {
          label: `${meta.symbol} - ${meta.shortName.substring(0, 15)}${meta.shortName.length > 15 ? "..." : ""}`,
          data: quotes.close,
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          pointRadius: timeRange === "1d" ? 3 : 0,
          tension: 0.1,
          fill: { target: "origin", above: `${color}10` },
        }
      }),
    }
  }, [chartData, timeRange])

  const pieChartData = useMemo(() => ({
    labels: topInvestments.map((inv) => inv.symbol),
    datasets: [{
      data: topInvestments.map(inv => 
        (inv.currentValue || inv.buyPrice) * inv.quantity
      ),
      backgroundColor: topInvestments.map(
        (_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]
      ),
      borderWidth: 1,
    }],
  }), [topInvestments])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 12, padding: 20, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => 
            `${context.dataset.label}: ${formatCurrency(context.raw)}`
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }), [formatCurrency])

  // Event handlers
  const handleRefresh = useCallback(() => fetchAllData(), [fetchAllData])

  const handleRangeChange = useCallback((value: TimeRange) => {
    setTimeRange(value)
    setInterval(value === "1d" || value === "5d" ? "1d" : "1wk")
  }, [])

  // Loading and empty states
  if (loading && !chartData.length) {
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Investment Portfolio</h1>
        <div className="flex items-center mt-4 md:mt-0">
          {lastUpdated && (
            <p className="text-sm text-gray-500 mr-4">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6"
        >
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
        <SummaryCard
          title="Total Invested"
          value={summary?.totalInvested}
          icon={<FiDollarSign size={20} />}
          color="blue"
          description="Top 5 investments by value"
          formatValue={formatCurrency}
        />

        {/* Current Value */}
        <SummaryCard
          title="Current Value"
          value={summary?.currentValue}
          icon={<FiTrendingUp size={20} />}
          color="green"
          description={summary ? formatPercentage(summary.profitLossPercentage) : "--"}
          formatValue={formatCurrency}
        />

        {/* Profit/Loss */}
        <SummaryCard
          title="Profit/Loss"
          value={summary?.profitLoss}
          icon={summary?.profitLoss && summary.profitLoss >= 0 ? 
            <FiTrendingUp size={20} /> : <FiTrendingDown size={20} />}
          color={summary?.profitLoss && summary.profitLoss >= 0 ? "green" : "red"}
          description={summary?.profitLoss && summary.profitLoss >= 0 ? "Profit" : "Loss"}
          percentage={summary?.profitLossPercentage}
          formatValue={formatCurrency}
          formatPercentage={formatPercentage}
        />

        {/* Best Performer */}
        <PerformanceCard 
          performer={summary?.bestPerformer}
          title="Best Performer"
          icon={<FiArrowUp size={20} />}
          color="purple"
          formatPercentage={formatPercentage}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Chart */}
        <ChartSection
          title="Top 5 Holdings Performance"
          chart={<Line data={lineChartData} options={chartOptions} />}
          timeRange={timeRange}
          onRangeChange={handleRangeChange}
        />

        {/* Allocation Chart */}
        <ChartSection
          title="Top 5 Holdings Allocation"
          chart={<Pie data={pieChartData} options={chartOptions} />}
        />
      </div>

      {/* Holdings Table */}
      <HoldingsTable 
        investments={topInvestments} 
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </div>
  )
}

// Sub-components for better organization
const SummaryCard = ({
  title,
  value,
  icon,
  color,
  description,
  percentage,
  formatValue,
  formatPercentage
}: {
  title: string
  value?: number
  icon: React.ReactNode
  color: "blue" | "green" | "red" | "purple"
  description?: string
  percentage?: number
  formatValue: (value: number) => string
  formatPercentage?: (value: number) => string
}) => {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-500", border: "border-gray-100" },
    green: { bg: "bg-green-50", text: "text-green-500", border: "border-gray-100" },
    red: { bg: "bg-red-50", text: "text-red-500", border: "border-red-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-500", border: "border-gray-100" },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-md p-6 border ${colorClasses[color].border}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 font-medium">{title}</h3>
        <div className={`p-2 rounded-full ${colorClasses[color].bg} ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">
        {value !== undefined ? formatValue(value) : "--"}
      </p>
      {percentage !== undefined ? (
        <div className="flex items-center mt-1">
          <span className={`text-sm ${percentage >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatPercentage?.(percentage) ?? percentage}
          </span>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </motion.div>
  )
}

const PerformanceCard = ({
  performer,
  title,
  icon,
  color,
  formatPercentage
}: {
  performer?: Investment | null
  title: string
  icon: React.ReactNode
  color: "blue" | "green" | "red" | "purple"
  formatPercentage?: (value: number) => string
}) => {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-500" },
    green: { bg: "bg-green-50", text: "text-green-500" },
    red: { bg: "bg-red-50", text: "text-red-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-500" },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 font-medium">{title}</h3>
        <div className={`p-2 rounded-full ${colorClasses[color].bg} ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>
      {performer ? (
        <div className="mt-2">
          <p className="text-xl font-bold">{performer.symbol}</p>
          <p className="text-sm text-gray-500">
            {performer.name.substring(0, 15)}
            {performer.name.length > 15 ? "..." : ""}
          </p>
          <p className="text-green-500 font-medium mt-1">
            {formatPercentage?.(
              (((performer.currentValue || performer.buyPrice) - performer.buyPrice) /
              performer.buyPrice) * 100
            ) ?? (
              `+${(
                (((performer.currentValue || performer.buyPrice) - performer.buyPrice) /
                performer.buyPrice) * 100
              ).toFixed(2)}%`
            )}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 mt-2">--</p>
      )}
    </motion.div>
  )
}

const ChartSection = ({
  title,
  chart,
  timeRange,
  onRangeChange
}: {
  title: string
  chart: React.ReactNode
  timeRange?: TimeRange
  onRangeChange?: (value: TimeRange) => void
}) => (
  <motion.div
    initial={{ opacity: 0, x: title === "Performance" ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
  >
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {timeRange && onRangeChange && (
        <Select value={timeRange} onValueChange={onRangeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
    <div className="h-80">{chart}</div>
  </motion.div>
)

const HoldingsTable = ({
  investments,
  formatCurrency,
  formatPercentage
}: {
  investments: Investment[]
  formatCurrency: (value: number) => string
  formatPercentage: (value: number) => string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
  >
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800">Your Top 5 Holdings</h3>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Symbol", "Name", "Purchase Date", "Purchase Price", 
              "Current Price", "Quantity", "Invested", "Value", "P/L"
            ].map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {investments.map((investment) => {
            const invested = investment.buyPrice * investment.quantity
            const currentValue = (investment.currentValue || investment.buyPrice) * investment.quantity
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
                  {format(new Date(investment.buyDate), "MMM dd, yyyy")}
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
                    }`}
                  >
                    {profitLoss >= 0 ? (
                      <FiArrowUp className="mr-1" />
                    ) : (
                      <FiArrowDown className="mr-1" />
                    )}
                    {formatCurrency(profitLoss)} ({formatPercentage(profitLossPercentage)})
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </motion.div>
)

export default InvestmentTracker