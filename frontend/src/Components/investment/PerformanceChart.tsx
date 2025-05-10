/** @format */
"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js"
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
import { Investment } from "@/Components/investment/investment"
import axios, { AxiosError } from "axios"
import { format } from "date-fns"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
)

// Constants
const COLOR_PALETTE = [
  "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", 
  "#c45850", "#4dc9f6", "#f67019", "#f53794",
  "#537bc4", "#acc236", "#166a8f", "#00a950",
  "#58595b", "#8549ba"
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
const BATCH_SIZE = 3 // Number of concurrent API requests

interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        currency: string
        symbol: string
        exchangeName: string
        fullExchangeName: string
        instrumentType: string
        regularMarketPrice: number
        regularMarketTime: number
        chartPreviousClose: number
        previousClose: number
        shortName: string
      }
      timestamp: number[]
      indicators: {
        quote: {
          low: number[]
          high: number[]
          close: number[]
          open: number[]
          volume: number[]
        }[]
      }
    }[]
    error: null
  }
}

interface PerformanceChartProps {
  investments: Investment[]
}

const PerformanceChart = ({ investments }: PerformanceChartProps) => {
  // State
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<typeof RANGE_OPTIONS[number]['value']>("1mo")
  const [interval, setInterval] = useState<typeof INTERVAL_OPTIONS[number]['value']>("1d")
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [chartData, setChartData] = useState<YahooChartResponse[]>([])
  const activeToastId = useRef<string | null>(null)
  
  // API Key Management
  const apiKeyStatus = useRef<Record<string, {
    valid: boolean
    lastUsed: number
    errorCount: number
  }>>({})

  // Filter out sold investments
  const activeInvestments = useMemo(
    () => investments.filter(inv => !inv.sellPrice),
    [investments]
  )

  // API Keys configuration
  const API_KEYS = useMemo(() => [
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
  ].filter(Boolean) as string[], [])

  // Initialize API key status
  useEffect(() => {
    const initialStatus: Record<string, any> = {}
    API_KEYS.forEach(key => {
      initialStatus[key] = {
        valid: true,
        lastUsed: 0,
        errorCount: 0,
      }
    })
    apiKeyStatus.current = initialStatus
  }, [API_KEYS])

  // Cache implementation
  const chartDataCache = useRef(new Map<string, {
    data: YahooChartResponse
    timestamp: number
  }>())

  // Get the next available API key with smart rotation
  const getNextApiKey = useCallback(() => {
    const validKeys = API_KEYS.filter(
      key => (apiKeyStatus.current[key]?.errorCount || 0) < MAX_RETRIES_PER_KEY
    )

    if (validKeys.length === 0) {
      return null
    }

    return [...validKeys].sort((a, b) => {
      const aStatus = apiKeyStatus.current[a] || { errorCount: 0, lastUsed: 0 }
      const bStatus = apiKeyStatus.current[b] || { errorCount: 0, lastUsed: 0 }

      if (aStatus.lastUsed !== bStatus.lastUsed) {
        return aStatus.lastUsed - bStatus.lastUsed
      }
      return aStatus.errorCount - bStatus.errorCount
    })[0]
  }, [API_KEYS])

  // Enhanced fetch function
  const fetchStockChartData = useCallback(async (symbol: string): Promise<YahooChartResponse> => {
    const cacheKey = `${symbol}-${timeRange}-${interval}`
    const cachedData = chartDataCache.current.get(cacheKey)

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
        const response = await axios.get<YahooChartResponse>(
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

        apiKeyStatus.current[apiKey] = {
          valid: true,
          lastUsed: Date.now(),
          errorCount: 0,
        }

        chartDataCache.current.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        })

        return response.data
      } catch (error) {
        attempts++
        const isRateLimit = 
          axios.isAxiosError(error) && 
          (error.response?.status === 429 || error.response?.status === 403)

        if (apiKeyStatus.current[apiKey]) {
          apiKeyStatus.current[apiKey] = {
            ...apiKeyStatus.current[apiKey],
            valid: !isRateLimit,
            lastUsed: Date.now(),
            errorCount: (apiKeyStatus.current[apiKey].errorCount || 0) + 1,
          }
        }

        if (isRateLimit) {
          await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY))
        }

        if (attempts >= maxAttempts) {
          throw error
        }
      }
    }

    throw new Error("Failed to fetch data after multiple attempts")
  }, [API_KEYS, timeRange, interval, getNextApiKey])

  // Process investments in batches
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeToastId.current) {
        toast.dismiss(activeToastId.current)
      }

      if (activeInvestments.length === 0) {
        setChartData([])
        setLastUpdated(new Date())
        return
      }

      const successfulData: YahooChartResponse[] = []
      const failedSymbols: string[] = []

      for (let i = 0; i < activeInvestments.length; i += BATCH_SIZE) {
        const batch = activeInvestments.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(inv => fetchStockChartData(inv.symbol))
        )

        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulData.push(result.value)
          } else {
            failedSymbols.push(batch[index]?.symbol || "Unknown")
          }
        })

        if (i + BATCH_SIZE < activeInvestments.length) {
          await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY))
        }
      }

      setChartData(successfulData)
      setLastUpdated(new Date())

      if (successfulData.length === 0) {
        setError("Failed to load investment data. API limit may be reached.")
      } else if (failedSymbols.length > 0) {
        toast.warning(
          `Loaded ${successfulData.length} of ${activeInvestments.length} investments`,
          {
            id: activeToastId.current,
            description:
              failedSymbols.length > 3
                ? `${failedSymbols.length} investments failed to load`
                : `Failed to load: ${failedSymbols.join(", ")}`,
          }
        )
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load data"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [activeInvestments, fetchStockChartData])

  // Initial data load and refresh on range/interval change
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Add this useEffect for interval synchronization
  useEffect(() => {
    const newInterval = timeRange === "1d" || timeRange === "5d" ? "1d" : "1wk"
    if (interval !== newInterval) {
      setInterval(newInterval)
    }
  }, [timeRange, interval])

  // Simplified range change handler
  const handleRangeChange = useCallback((value: typeof RANGE_OPTIONS[number]['value']) => {
    setTimeRange(value)
  }, [])

  // Controlled interval change handler
  const handleIntervalChange = useCallback((value: typeof INTERVAL_OPTIONS[number]['value']) => {
    const allowedIntervals = timeRange === "1d" || timeRange === "5d" 
      ? ["1d"] 
      : ["1d", "1wk", "1mo"]
    
    if (allowedIntervals.includes(value)) {
      setInterval(value)
    }
  }, [timeRange])

  // Format currency based on symbol
  const formatCurrency = useCallback((value: number, symbol?: string) => {
    const currency = symbol?.includes(".NS") ? "INR" : "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }, [])

  // Prepare chart data
  const lineChartData = useMemo(() => {
    if (activeInvestments.length === 0 || chartData.length === 0) {
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

    const referenceTimestamps = chartData[0]?.chart?.result?.[0]?.timestamp || []

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
  }, [chartData, timeRange, activeInvestments])

  const chartOptions = useMemo(() => ({
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
            const value = context.parsed.y
            const currency = context.dataset.label?.includes(".NS") ? "INR" : "USD"

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
  }), [])

  const handleRefresh = useCallback(() => {
    activeInvestments.forEach(inv => {
      const cacheKey = `${inv.symbol}-${timeRange}-${interval}`
      chartDataCache.current.delete(cacheKey)
    })
    fetchAllData()
  }, [activeInvestments, timeRange, interval, fetchAllData])

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Performance Chart
          </h3>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {format(lastUpdated, "MMM dd, HH:mm")}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end">
          <div className="flex gap-2 w-full">
            <Select 
              value={timeRange} 
              onValueChange={handleRangeChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={interval} 
              onValueChange={handleIntervalChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS
                  .filter(option => {
                    if (timeRange === "1d" || timeRange === "5d") {
                      return option.value === "1d"
                    }
                    return ["1d", "1wk", "1mo"].includes(option.value)
                  })
                  .map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin">↻</div>
            ) : (
              <div>↻</div>
            )}
          </Button>
        </div>
      </div>
      
      <div className="h-[400px] relative">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : activeInvestments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No active investments to display
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Failed to load chart data
          </div>
        ) : (
          <Line 
            data={lineChartData} 
            options={chartOptions} 
          />
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  )
}

export default React.memo(PerformanceChart)