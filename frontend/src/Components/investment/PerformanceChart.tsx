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
  Zoom,
} from "chart.js"
import zoomPlugin from 'chartjs-plugin-zoom'
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
import { format, sub } from "date-fns"

// Register ChartJS components with zoom plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin
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

const API_RETRY_DELAY = 500 // 0.5 second between retries
const MAX_RETRIES_PER_KEY = 2 // Max retries per API key
const BATCH_SIZE = 3 // Number of concurrent API requests
const MAX_DATA_POINTS = 100 // Limit data points for better performance
const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds auto-refresh

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
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const chartRef = useRef<any>(null)
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

  // Get the next available API key with smart rotation
  const getNextApiKey = useCallback(() => {
    const validKeys = API_KEYS.filter(
      key => (apiKeyStatus.current[key]?.errorCount || 0) < MAX_RETRIES_PER_KEY
    )

    if (validKeys.length === 0) {
      return null
    }

    // Sort keys by least recently used and with fewest errors
    return [...validKeys].sort((a, b) => {
      const aStatus = apiKeyStatus.current[a] || { errorCount: 0, lastUsed: 0 }
      const bStatus = apiKeyStatus.current[b] || { errorCount: 0, lastUsed: 0 }

      if (aStatus.lastUsed !== bStatus.lastUsed) {
        return aStatus.lastUsed - bStatus.lastUsed
      }
      return aStatus.errorCount - bStatus.errorCount
    })[0]
  }, [API_KEYS])

  /**
   * Fetches stock chart data with retry logic
   * @param symbol Stock symbol to fetch data for
   * @returns Promise with chart data
   */
  const fetchStockChartData = useCallback(async (symbol: string): Promise<YahooChartResponse> => {
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

        // Validate response structure
        if (!response.data?.chart?.result?.[0]) {
          throw new Error("Invalid response structure")
        }

        // Update API key status on success
        apiKeyStatus.current[apiKey] = {
          valid: true,
          lastUsed: Date.now(),
          errorCount: 0,
        }

        return response.data
      } catch (error) {
        attempts++
        const isRateLimit = 
          axios.isAxiosError(error) && 
          (error.response?.status === 429 || error.response?.status === 403)

        // Update API key status on failure
        if (apiKeyStatus.current[apiKey]) {
          apiKeyStatus.current[apiKey] = {
            ...apiKeyStatus.current[apiKey],
            valid: !isRateLimit,
            lastUsed: Date.now(),
            errorCount: (apiKeyStatus.current[apiKey].errorCount || 0) + 1,
          }
        }

        // Delay before retry if rate limited
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

  /**
   * Fetches data for all active investments in batches
   */
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Dismiss any existing toasts
      if (activeToastId.current) {
        toast.dismiss(activeToastId.current)
      }

      // Handle empty investments case
      if (activeInvestments.length === 0) {
        setChartData([])
        setLastUpdated(new Date())
        return
      }

      const successfulData: YahooChartResponse[] = []
      const failedSymbols: string[] = []

      // Process investments in batches
      for (let i = 0; i < activeInvestments.length; i += BATCH_SIZE) {
        const batch = activeInvestments.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(inv => fetchStockChartData(inv.symbol))
        )

        // Process batch results
        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulData.push(result.value)
          } else {
            failedSymbols.push(batch[index]?.symbol || "Unknown")
          }
        })

        // Add delay between batches if not the last batch
        if (i + BATCH_SIZE < activeInvestments.length) {
          await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY))
        }
      }

      setChartData(successfulData)
      setLastUpdated(new Date())

      // Show appropriate feedback based on results
      if (successfulData.length === 0) {
        setError("Failed to load investment data. API limit may be reached.")
      } else if (failedSymbols.length > 0) {
        activeToastId.current = toast.warning(
          `Loaded ${successfulData.length} of ${activeInvestments.length} investments`,
          {
            description:
              failedSymbols.length > 3
                ? `${failedSymbols.length} investments failed to load`
                : `Failed to load: ${failedSymbols.join(", ")}`,
          }
        ) as string
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
  }, [fetchAllData, timeRange, interval, refreshTrigger])

  // Auto-refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

  // Refresh data when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTrigger(prev => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Synchronize interval with time range
  useEffect(() => {
    const newInterval = timeRange === "1d" || timeRange === "5d" ? "1d" : "1wk"
    if (interval !== newInterval) {
      setInterval(newInterval)
    }
  }, [timeRange, interval])

  // Handlers for user interactions
  const handleRangeChange = useCallback((value: typeof RANGE_OPTIONS[number]['value']) => {
    setTimeRange(value)
  }, [])

  const handleIntervalChange = useCallback((value: typeof INTERVAL_OPTIONS[number]['value']) => {
    const allowedIntervals = timeRange === "1d" || timeRange === "5d" 
      ? ["1d"] 
      : ["1d", "1wk", "1mo"]
    
    if (allowedIntervals.includes(value)) {
      setInterval(value)
    }
  }, [timeRange])

  // Reset zoom on chart when time range changes
  const resetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom()
    }
  }, [])

  useEffect(() => {
    resetZoom()
  }, [timeRange, resetZoom])

  /**
   * Prepares chart data with optimized performance
   */
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

    // Use the first dataset as reference for timestamps
    const referenceTimestamps = chartData[0]?.chart?.result?.[0]?.timestamp || []
    
    // Downsample data if too many points for better performance
    const step = Math.max(1, Math.floor(referenceTimestamps.length / MAX_DATA_POINTS))
    const sampledTimestamps = referenceTimestamps.filter((_, i) => i % step === 0)

    /**
     * Formats timestamp labels based on time range
     * @param timestamp Unix timestamp
     * @returns Formatted date string
     */
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
      labels: sampledTimestamps.map(formatLabel),
      datasets: chartData.map((data, index) => {
        const result = data.chart.result[0]
        const meta = result.meta
        const quotes = result.indicators.quote[0]
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

        // Downsample the data points to match sampled timestamps
        const sampledClosePrices = quotes.close.filter((_, i) => i % step === 0)

        return {
          label: `${meta.symbol} - ${meta.shortName.substring(0, 15)}${
            meta.shortName.length > 15 ? "..." : ""
          }`,
          data: sampledClosePrices,
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

  // Chart options with zoom functionality
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
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  }), [])

  /**
   * Handles manual refresh
   */
  const handleRefresh = useCallback(() => {
    // Reset zoom and trigger refresh
    resetZoom()
    setRefreshTrigger(prev => prev + 1)
  }, [resetZoom])

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Investment Performance
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
              disabled={loading || timeRange === "1d" || timeRange === "5d"}
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
          
          <div className="flex gap-2">
            <Button 
              onClick={resetZoom}
              size="sm" 
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={loading}
              title="Reset Zoom"
            >
              ⎚
            </Button>
            
            <Button 
              onClick={handleRefresh} 
              size="sm" 
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={loading}
              title="Refresh Data"
            >
              {loading ? (
                <div className="animate-spin">↻</div>
              ) : (
                <div>↻</div>
              )}
            </Button>
          </div>
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
            ref={chartRef}
            data={lineChartData} 
            options={chartOptions}
            data-testid="performance-chart"
          />
        )}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <span>Pinch or scroll to zoom, drag to pan</span>
        )}
        <span>{chartData.length} of {activeInvestments.length} investments shown</span>
      </div>
    </div>
  )
}

export default React.memo(PerformanceChart)