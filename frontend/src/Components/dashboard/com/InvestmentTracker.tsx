/** @format */
"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  FiInfo,
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
import axios, { AxiosError } from "axios"
import { format, formatDistanceToNow, subDays } from "date-fns"

// Register ChartJS components
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

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache
const API_RETRY_DELAY = 500 // 0.5 second between retries
const MAX_RETRIES_PER_KEY = 2 // Max retries per API key

type TimeRange = (typeof RANGE_OPTIONS)[number]["value"]
type Interval = (typeof INTERVAL_OPTIONS)[number]["value"]

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  bestPerformer: Investment | null
  worstPerformer: Investment | null
  totalSold: number
}

const DEFAULT_SUMMARY: PortfolioSummary = {
  totalInvested: 0,
  currentValue: 0,
  profitLoss: 0,
  profitLossPercentage: 0,
  bestPerformer: null,
  worstPerformer: null,
  totalSold: 0,
}

const InvestmentTracker = () => {
  // State
  const investments = useAppSelector((state) => state.investment.investments)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary>(DEFAULT_SUMMARY)
  const [timeRange, setTimeRange] = useState<TimeRange>("1mo")
  const [interval, setInterval] = useState<Interval>("1d")
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const activeToastId = useRef<string | null>(null)
  const apiKeyStatus = useRef<
    Record<
      string,
      {
        valid: boolean
        lastUsed: number
        errorCount: number
      }
    >
  >({})

  // Filter out sold investments
  const activeInvestments = useMemo(
    () => investments.filter((inv) => !inv.sellPrice),
    [investments]
  )

  // API Keys configuration
  const API_KEYS = useMemo(
    () =>
      [
        process.env.NEXT_PUBLIC_RAPIDAPI1,
        process.env.NEXT_PUBLIC_RAPIDAPI2,
        process.env.NEXT_PUBLIC_RAPIDAPI3,
        process.env.NEXT_PUBLIC_RAPIDAPI4,
        process.env.NEXT_PUBLIC_RAPIDAPI5,
        process.env.NEXT_PUBLIC_RAPIDAPI6,
        process.env.NEXT_PUBLIC_RAPIDAPI7,
        process.env.NEXT_PUBLIC_RAPIDAPI8,
        process.env.NEXT_PUBLIC_RAPIDAPI9,
        process.env.NEXT_PUBLIC_RAPIDAPI10,
      ].filter(Boolean) as string[],
    []
  )

  // Initialize API key status
  useEffect(() => {
    const initialStatus: Record<string, any> = {}
    API_KEYS.forEach((key) => {
      initialStatus[key] = {
        valid: true,
        lastUsed: 0,
        errorCount: 0,
      }
    })
    apiKeyStatus.current = initialStatus
  }, [API_KEYS])

  // Memoized derived values
  const topInvestments = useMemo(
    () =>
      [...activeInvestments]
        .sort((a, b) => b.buyPrice * b.quantity - a.buyPrice * a.quantity)
        .slice(0, 5),
    [activeInvestments]
  )

  const hasInvestments = useMemo(
    () => activeInvestments.length > 0,
    [activeInvestments]
  )

  // Formatting utilities
  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    []
  )

  const formatPercentage = useCallback(
    (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
    []
  )

  // Portfolio calculations
  const calculateSummary = useCallback((investments: Investment[]) => {
    const activeInvestments = investments.filter((inv) => !inv.sellPrice)
    const soldInvestments = investments.filter((inv) => inv.sellPrice)

    const totalInvested = activeInvestments.reduce(
      (sum, investment) => sum + investment.buyPrice * investment.quantity,
      0
    )

    const currentValue = activeInvestments.reduce(
      (sum, investment) =>
        sum + (investment.sellPrice !== undefined ? (investment.currentValue || investment.buyPrice) * investment.quantity : 0), 0)

    const totalSold = soldInvestments.reduce(
      (sum, investment) => sum + (investment.sellPrice? investment.sellPrice-investment.buyPrice  : 0) * investment.quantity,
      0
    )

    const profitLoss = currentValue - totalInvested + totalSold
    const profitLossPercentage =
      totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

    const performers = activeInvestments
      .map((investment) => ({
        ...investment,
        performance:
          investment.buyPrice > 0
            ? (((investment.currentValue || investment.buyPrice) -
                investment.buyPrice) /
                investment.buyPrice) *
              100
            : 0,
      }))
      .sort((a, b) => b.performance - a.performance)

    setSummary({
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercentage,
      bestPerformer: performers[0] || null,
      worstPerformer: performers[performers.length - 1] || null,
      totalSold,
    })
  }, [])

  // Cache implementation
  const chartDataCache = useMemo(
    () =>
      new Map<
        string,
        {
          data: any
          timestamp: number
        }
      >(),
    []
  )

  // Get the next available API key with smart rotation
  const getNextApiKey = useCallback(() => {
    // Filter out invalid keys (those with too many errors)
    const validKeys = API_KEYS.filter(
      (key) => (apiKeyStatus.current[key]?.errorCount || 0) < MAX_RETRIES_PER_KEY
    )

    if (validKeys.length === 0) {
      return null // No valid keys left
    }

    // Sort by least recently used and then by error count
    return [...validKeys].sort((a, b) => {
      const aStatus = apiKeyStatus.current[a] || { errorCount: 0, lastUsed: 0 }
      const bStatus = apiKeyStatus.current[b] || { errorCount: 0, lastUsed: 0 }

      // First sort by last used time (oldest first)
      if (aStatus.lastUsed !== bStatus.lastUsed) {
        return aStatus.lastUsed - bStatus.lastUsed
      }

      // Then by error count (fewest errors first)
      return aStatus.errorCount - bStatus.errorCount
    })[0]
  }, [API_KEYS])

  // Enhanced fetch function with smart key rotation and error handling
  const fetchStockChartData = useCallback(
    async (symbol: string): Promise<any> => {
      const cacheKey = `${symbol}-${timeRange}-${interval}`
      const cachedData = chartDataCache.get(cacheKey)

      // Return cached data if valid
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        return cachedData.data
      }

      let attempts = 0
      const maxAttempts = API_KEYS.length * MAX_RETRIES_PER_KEY

      while (attempts < maxAttempts) {
        const apiKey = getNextApiKey()
        if (!apiKey) {
          throw new Error("All API keys exhausted")
        }

        try {
          const response = await axios.get(
            `https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart`,
            {
              params: {
                symbol,
                range: timeRange,
                interval,
                region: symbol.includes(".NS") ? "IN" : "US",
              },
              headers: {
                "x-rapidapi-key": apiKey,
                "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
              },
              timeout: 8000,
            }
          )

          if (!response.data?.chart?.result?.[0]) {
            throw new Error("Invalid response structure")
          }

          // Update key status on success
          apiKeyStatus.current[apiKey] = {
            valid: true,
            lastUsed: Date.now(),
            errorCount: 0,
          }

          // Update cache
          chartDataCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
          })

          return response.data
        } catch (error) {
          attempts++
          const isRateLimit =
            axios.isAxiosError(error) &&
            (error.response?.status === 429 || error.response?.status === 403)

          // Update key status on failure
          if (apiKeyStatus.current[apiKey]) {
            apiKeyStatus.current[apiKey] = {
              ...apiKeyStatus.current[apiKey],
              valid: !isRateLimit,
              lastUsed: Date.now(),
              errorCount: (apiKeyStatus.current[apiKey].errorCount || 0) + 1,
            }
          }

          if (isRateLimit) {
            await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY))
          }

          // If this was our last attempt, throw the error
          if (attempts >= maxAttempts) {
            throw error
          }
        }
      }

      throw new Error("Failed to fetch data after multiple attempts")
    },
    [API_KEYS, timeRange, interval, chartDataCache, getNextApiKey]
  )

  // Fetch all investment data with error handling
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setApiError(null)

      if (activeToastId.current) {
        toast.dismiss(activeToastId.current)
      }

      if (!hasInvestments) {
        setChartData([])
        calculateSummary([])
        setInitialLoadComplete(true)
        return
      }

      // Only fetch data for active investments
      const results = await Promise.allSettled(
        topInvestments.map((inv) => fetchStockChartData(inv.symbol))
      )

      const successfulData: any[] = []
      const failedSymbols: string[] = []

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulData.push(result.value)
        } else {
          failedSymbols.push(topInvestments[index]?.symbol || "Unknown")
        }
      })

      setChartData(successfulData)
      calculateSummary(investments) // Calculate summary for all investments (including sold ones)
      setLastUpdated(new Date())
      setInitialLoadComplete(true)

      if (successfulData.length === 0) {
        setApiError("Failed to load investment data. API limit may be reached.")
        toast.error("Failed to load investment data", {
          id: activeToastId.current,
        })
      } else if (failedSymbols.length > 0) {
        toast.warning(
          `Loaded ${successfulData.length} of ${topInvestments.length} investments`,
          {
            id: activeToastId.current,
            description:
              failedSymbols.length > 3
                ? `${failedSymbols.length} investments failed to load`
                : `Failed to load: ${failedSymbols.join(", ")}`,
          }
        )
      } else {
        toast.success("Investment data loaded successfully")
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load data"
      setApiError(errorMessage)
      toast.error("Failed to load investment data", {
        id: activeToastId.current,
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [
    topInvestments,
    fetchStockChartData,
    calculateSummary,
    hasInvestments,
    investments,
  ])

  // Initial data load and refresh on range/interval change
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Chart data preparation
  const lineChartData = useMemo(() => {
    if (!hasInvestments || chartData.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "No Investments",
            data: [1],
            borderColor: "#cccccc",
            backgroundColor: "#f0f0f0",
            borderWidth: 1,
          },
        ],
      }
    }

    const referenceTimestamps =
      chartData[0]?.chart?.result?.[0]?.timestamp || []

    const formatLabel = (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      switch (timeRange) {
        case "1d":
          return format(date, "HH:mm")
        case "5d":
        case "1mo":
          return format(date, "MMM dd")
        case "3mo":
        case "6mo":
          return format(date, "MMM")
        default:
          return format(date, "MMM yyyy")
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
          label: `${meta.symbol} - ${meta.shortName.substring(0, 15)}${
            meta.shortName.length > 15 ? "..." : ""
          }`,
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
  }, [chartData, timeRange, hasInvestments])

  const pieChartData = useMemo(
    () => ({
      labels: hasInvestments
        ? topInvestments.map((inv) => inv.symbol)
        : ["No Investments"],
      datasets: [
        {
          data: hasInvestments
            ? topInvestments.map(
                (inv) => (inv.currentValue || inv.buyPrice) * inv.quantity
              )
            : [1],
          backgroundColor: hasInvestments
            ? topInvestments.map(
                (_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]
              )
            : ["#cccccc"],
          borderWidth: 1,
        },
      ],
    }),
    [topInvestments, hasInvestments]
  )

  // console.log(pieChartData)

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
            font: {
              size: window.innerWidth < 768 ? 10 : 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || ""
              const value = context.parsed.y
              const currency = context.dataset.label?.includes(".NS")
                ? "INR"
                : "USD"

              return value !== null
                ? `${label}: ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency,
                  }).format(value)}`
                : label
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

  // Event handlers
  const handleRefresh = useCallback(() => {
    // Clear cache for current range/interval
    topInvestments.forEach((inv) => {
      const cacheKey = `${inv.symbol}-${timeRange}-${interval}`
      chartDataCache.delete(cacheKey)
    })
    fetchAllData()
  }, [fetchAllData, topInvestments, timeRange, interval, chartDataCache])

  const handleRangeChange = useCallback((value: TimeRange) => {
    setTimeRange(value)
    setInterval(value === "1d" || value === "5d" ? "1d" : "1wk")
  }, [])

  // Show loading state only if it's the initial load or we have investments
  const showLoadingState = loading && (!initialLoadComplete || hasInvestments)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Investment Portfolio
          </h1>
          {lastUpdated && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={timeRange}
            onValueChange={handleRangeChange}
            disabled={showLoadingState}>
            <SelectTrigger className="w-full md:w-[150px]">
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

          <Button
            onClick={handleRefresh}
            disabled={showLoadingState}
            variant="outline"
            size="sm"
            className="shrink-0">
            {showLoadingState ? (
              <FiRefreshCw className="animate-spin h-4 w-4" />
            ) : (
              <>
                <FiRefreshCw className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Refresh</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 md:p-4 rounded mb-6">
          <div className="flex items-start">
            <FiAlertTriangle className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {apiError}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!hasInvestments && initialLoadComplete && !showLoadingState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 md:p-4 rounded mb-6">
          <div className="flex items-start">
            <FiInfo className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                No active investments found
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Add investments to see your portfolio analysis
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <SummaryCard
          title="Total Invested"
          value={summary.totalInvested}
          icon={<FiDollarSign className="h-5 w-5" />}
          color="blue"
          description={
            hasInvestments ? "Across active holdings" : "No investments"
          }
          formatValue={formatCurrency}
          loading={showLoadingState}
        />

        <SummaryCard
          title="Current Value"
          value={summary.currentValue}
          icon={<FiTrendingUp className="h-5 w-5" />}
          color="green"
          description={
            hasInvestments
              ? `${formatPercentage(summary.profitLossPercentage)}`
              : "--"
          }
          formatValue={formatCurrency}
          loading={showLoadingState}
        />

        <SummaryCard
          title="Net Profit/Loss"
          value={summary.profitLoss}
          icon={
            summary.profitLoss >= 0 ? (
              <FiTrendingUp className="h-5 w-5" />
            ) : (
              <FiTrendingDown className="h-5 w-5" />
            )
          }
          color={summary.profitLoss >= 0 ? "green" : "red"}
          description={
            hasInvestments
              ? `Includes ${formatCurrency(summary.totalSold)} from sold investments`
              : "--"
          }
          percentage={summary.profitLossPercentage}
          formatValue={formatCurrency}
          formatPercentage={formatPercentage}
          loading={showLoadingState}
        />

        <PerformanceCard
          performer={summary.bestPerformer}
          title={hasInvestments ? "Best Performer" : "Top Holding"}
          icon={<FiArrowUp className="h-5 w-5" />}
          color="purple"
          formatPercentage={formatPercentage}
          loading={showLoadingState}
          hasInvestments={hasInvestments}
        />
      </div>

      {/* Charts Section */}
      {showLoadingState ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          <ChartSectionSkeleton />
          <ChartSectionSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          <ChartSection
            title={
              hasInvestments ? "Performance Trend" : "Performance Overview"
            }
            chart={
              <Line
                data={lineChartData}
                options={chartOptions}
                className="h-80"
              />
            }
            timeRange={timeRange}
            onRangeChange={handleRangeChange}
            hasInvestments={hasInvestments}
            loading={showLoadingState}
          />
          
          <ChartSection
            title={
              hasInvestments
                ? "Portfolio Allocation"
                : "Investment Distribution"
            }
            chart={
              <Pie
                data={pieChartData}
                options={chartOptions}
                className="h-80"
              />
            }
            hasInvestments={hasInvestments}
            loading={showLoadingState}
          />
        </div>
      )}

      {/* Holdings Table */}
      <HoldingsTable
        investments={investments} // Show all investments including sold ones
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
        hasInvestments={investments.length > 0} // Check all investments, not just active ones
        loading={showLoadingState}
      />
    </div>
  )
}

// Sub-components (keep the same as before)
interface SummaryCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: "blue" | "green" | "red" | "purple"
  description?: string
  percentage?: number
  formatValue: (value: number) => string
  formatPercentage?: (value: number) => string
  loading?: boolean
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
  description,
  percentage,
  formatValue,
  formatPercentage,
  loading = false,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-800",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-100 dark:border-green-800",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-100 dark:border-red-800",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-100 dark:border-purple-800",
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border ${colorClasses[color].border} h-full`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
          {title}
        </h3>
        <div
          className={`p-2 rounded-full ${colorClasses[color].bg} ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-3/4 dark:bg-gray-700" />
          <Skeleton className="h-4 w-1/2 dark:bg-gray-700" />
        </div>
      ) : (
        <>
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatValue(value)}
          </p>
          {percentage !== undefined ? (
            <div className="flex items-center mt-1">
              <span
                className={`text-sm ${
                  percentage >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {formatPercentage?.(percentage) ?? percentage}
              </span>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

interface PerformanceCardProps {
  performer: Investment | null
  title: string
  icon: React.ReactNode
  color: "blue" | "green" | "red" | "purple"
  formatPercentage?: (value: number) => string
  loading?: boolean
  hasInvestments?: boolean
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({
  performer,
  title,
  icon,
  color,
  formatPercentage,
  loading = false,
  hasInvestments = false,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
    },
  }

  const performanceValue =
    performer && performer.buyPrice > 0 && !performer.sellPrice
      ? (((performer.currentValue || performer.buyPrice) - performer.buyPrice) /
          performer.buyPrice) *
        100
      : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
          {title}
        </h3>
        <div
          className={`p-2 rounded-full ${colorClasses[color].bg} ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-6 w-3/4 dark:bg-gray-700" />
          <Skeleton className="h-4 w-1/2 dark:bg-gray-700" />
          <Skeleton className="h-4 w-1/3 dark:bg-gray-700" />
        </div>
      ) : (
        <div className="mt-2">
          {hasInvestments && performer ? (
            <>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {performer.symbol}
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                {performer.name}
              </p>
              <p
                className={`mt-1 text-sm md:text-base font-medium ${
                  performanceValue >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {formatPercentage?.(performanceValue) ??
                  `${performanceValue.toFixed(2)}%`}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg md:text-xl font-bold text-gray-400 dark:text-gray-500">
                --
              </p>
              <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">
                No data
              </p>
              <p className="mt-1 text-sm md:text-base text-gray-400 dark:text-gray-500">
                0%
              </p>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

interface ChartSectionProps {
  title: string
  chart: React.ReactNode
  timeRange?: TimeRange
  onRangeChange?: (value: TimeRange) => void
  hasInvestments?: boolean
  loading?: boolean
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  chart,
  timeRange,
  onRangeChange,
  hasInvestments = false,
  loading = false,
}) => (
  <motion.div
    initial={{ opacity: 0, x: title.includes("Performance") ? -10 : 10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white dark:bg-gray-800 p-2 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
      <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
      {timeRange && onRangeChange && (
        <Select
          value={timeRange}
          onValueChange={onRangeChange}
          disabled={!hasInvestments || loading}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Range" />
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
    <div className="h-64 md:h-80">{chart}</div>
  </motion.div>
)

const ChartSectionSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white dark:bg-gray-800 p-2 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
      <Skeleton className="h-6 w-1/3 dark:bg-gray-700" />
      <Skeleton className="h-9 w-[120px] dark:bg-gray-700" />
    </div>
    <div className="h-64 md:h-80 flex items-center justify-center">
      <Skeleton className="h-full w-full dark:bg-gray-700" />
    </div>
  </motion.div>
)

interface HoldingsTableProps {
  investments: Investment[]
  formatCurrency: (value: number) => string
  formatPercentage: (value: number) => string
  hasInvestments?: boolean
  loading?: boolean
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({
  investments,
  formatCurrency,
  formatPercentage,
  hasInvestments = false,
  loading = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
    <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
        Your Holdings
      </h3>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {[
              "Symbol",
              "Name",
              "Purchase Date",
              "Purchase Price",
              "Current Price",
              "Quantity",
              "Invested",
              "Value",
              "P/L",
              "Status",
            ].map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
                    <Skeleton className="h-4 w-full dark:bg-gray-700" />
                  </td>
                ))}
              </tr>
            ))
          ) : hasInvestments ? (
            investments.map((investment) => {
              const isSold = !!investment.sellPrice
              const invested = investment.buyPrice * investment.quantity
              const currentValue = isSold
                ? investment.sellPrice! * investment.quantity
                : (investment.currentValue || investment.buyPrice) *
                  investment.quantity
              const profitLoss = currentValue - invested
              const profitLossPercentage =
                invested > 0 ? (profitLoss / invested) * 100 : 0

              return (
                <tr
                  key={investment.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isSold ? "opacity-70" : ""
                  }`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {investment.symbol}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {investment.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(investment.buyDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(investment.buyPrice)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {isSold
                      ? formatCurrency(investment.sellPrice!)
                      : investment.currentValue
                      ? formatCurrency(investment.currentValue)
                      : "--"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {investment.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(invested)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(currentValue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div
                      className={`flex items-center ${
                        profitLoss >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {profitLoss >= 0 ? (
                        <FiArrowUp className="mr-1 flex-shrink-0" />
                      ) : (
                        <FiArrowDown className="mr-1 flex-shrink-0" />
                      )}
                      <span>
                        {formatCurrency(profitLoss)} (
                        {formatPercentage(profitLossPercentage)})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isSold
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      }`}>
                      {isSold ? "Sold" : "Active"}
                    </span>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td
                colSpan={10}
                className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No investment data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
)

export default InvestmentTracker