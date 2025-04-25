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
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Investment } from "@/types/investment"
import { DateTime } from "luxon"
import axios from "axios"

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

const COLOR_PALETTE = [
  "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
  "#c45850", "#4dc9f6", "#f67019", "#f53794",
  "#537bc4", "#acc236", "#166a8f", "#00a950",
  "#58595b", "#8549ba"
]

const RANGE_OPTIONS = [
  { value: '1d', label: '1 Day' },
  { value: '5d', label: '5 Days' },
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
  { value: '10y', label: '10 Years' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'max', label: 'Max' },
] as const

const INTERVAL_OPTIONS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1d', label: '1 Day' },
  { value: '1wk', label: '1 Week' },
  { value: '1mo', label: '1 Month' },
] as const

const DEFAULT_RANGE = '1mo'
const DEFAULT_INTERVAL = '1d'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache
const MAX_RETRIES = 3

interface PerformanceChartProps {
  investments: Investment[]
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ investments }) => {
  // Filter out sold investments
  const activeInvestments = useMemo(
    () => investments.filter(inv => !inv.sellPrice),
    [investments]
  )

  // State
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<string>(DEFAULT_RANGE)
  const [interval, setInterval] = useState<string>(DEFAULT_INTERVAL)
  const [lastRefresh, setLastRefresh] = useState<DateTime | null>(null)
  
  // Refs
  const cache = useRef<Record<string, { data: any; timestamp: number }>>({})
  const apiKeyStatus = useRef<Record<string, { failures: number; lastUsed: number }>>({})
  const isMounted = useRef(true)

  // API Keys configuration
  const API_KEYS = useMemo(() => [
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_1,
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_2,
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_3,
  ].filter(Boolean) as string[], [])

  // Initialize API key status
  useEffect(() => {
    const initialStatus: Record<string, { failures: number; lastUsed: number }> = {}
    API_KEYS.forEach(key => {
      initialStatus[key] = { failures: 0, lastUsed: 0 }
    })
    apiKeyStatus.current = initialStatus

    return () => {
      isMounted.current = false
    }
  }, [API_KEYS])

  // Get the best available API key
  const getBestApiKey = useCallback(() => {
    const availableKeys = Object.entries(apiKeyStatus.current)
      .filter(([_, status]) => status.failures < MAX_RETRIES)
      .sort((a, b) => a[1].failures - b[1].failures || a[1].lastUsed - b[1].lastUsed)

    return availableKeys[0]?.[0] || null
  }, [])

  // Fetch stock chart data with retry logic
  const fetchStockChartData = useCallback(async (
    symbol: string,
    retryCount = 0
  ): Promise<any> => {
    const cacheKey = `${symbol}-${range}-${interval}`
    const cachedData = cache.current[cacheKey]
    
    // Return cached data if valid
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data
    }

    const apiKey = getBestApiKey()
    if (!apiKey) {
      throw new Error('No available API keys')
    }

    try {
      const response = await axios.get(
        `https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart`,
        {
          params: {
            symbol,
            range,
            interval,
            region: symbol.includes('.NS') ? 'IN' : 'US'
          },
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com'
          },
          timeout: 10000
        }
      )

      if (!response.data?.chart?.result?.[0]) {
        throw new Error('Invalid response structure')
      }

      // Update cache
      cache.current[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      }

      // Update API key status
      apiKeyStatus.current[apiKey] = {
        failures: 0,
        lastUsed: Date.now()
      }

      return response.data
    } catch (error) {
      // Update API key status on failure
      if (apiKeyStatus.current[apiKey]) {
        apiKeyStatus.current[apiKey] = {
          ...apiKeyStatus.current[apiKey],
          failures: apiKeyStatus.current[apiKey].failures + 1,
          lastUsed: Date.now()
        }
      }

      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return fetchStockChartData(symbol, retryCount + 1)
      }
      throw error
    }
  }, [range, interval, getBestApiKey])

  // Fetch data for all active investments
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return

    try {
      setLoading(true)
      setError(null)

      if (activeInvestments.length === 0) {
        setChartData([])
        setLastRefresh(DateTime.now())
        return
      }

      // Fetch data for each investment with concurrency control
      const MAX_CONCURRENT = 3
      const results = []
      
      for (let i = 0; i < activeInvestments.length; i += MAX_CONCURRENT) {
        const batch = activeInvestments.slice(i, i + MAX_CONCURRENT)
        const batchResults = await Promise.allSettled(
          batch.map(inv => fetchStockChartData(inv.symbol)))
        results.push(...batchResults)
        
        // Add delay between batches if needed
        if (i + MAX_CONCURRENT < activeInvestments.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const successfulData: any[] = []
      const errors: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulData.push(result.value)
        } else {
          const symbol = activeInvestments[index]?.symbol || 'Unknown'
          errors.push(`${symbol}: ${result.reason instanceof Error ? result.reason.message : 'Failed to load'}`)
        }
      })

      if (isMounted.current) {
        setChartData(successfulData)
        setLastRefresh(DateTime.now())

        if (errors.length > 0) {
          setError(`Failed to load ${errors.length}/${activeInvestments.length} investments`)
          toast.warning(
            `Loaded ${successfulData.length} of ${activeInvestments.length}`,
            {
              description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? `... +${errors.length - 3} more` : '')
            }
          )
        } else if (successfulData.length > 0) {
          toast.success('Investment data loaded')
        }
      }
    } catch (error) {
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
        toast.error('Failed to load investment data')
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [activeInvestments, fetchStockChartData])

  // Initial data fetch and refresh on range/interval change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Format date based on selected range
  const formatDate = useCallback((timestamp: number) => {
    const date = DateTime.fromSeconds(timestamp)
    switch (range) {
      case '1d': return date.toFormat('HH:mm')
      case '5d': return date.toFormat('MMM dd')
      case '1mo': return date.toFormat('MMM dd')
      case '3mo': case '6mo': return date.toFormat('MMM')
      default: return date.toFormat('MMM yyyy')
    }
  }, [range])

  // Prepare chart data
  const chartDataConfig = useMemo(() => {
    if (chartData.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [{
          label: 'No Investments',
          data: [1],
          borderColor: '#cccccc',
          backgroundColor: '#f0f0f0',
          borderWidth: 1
        }]
      }
    }

    // Find the dataset with most points as reference
    const referenceData = chartData.reduce((prev, current) => 
      (current?.chart?.result?.[0]?.timestamp?.length || 0) > 
      (prev?.chart?.result?.[0]?.timestamp?.length || 0) ? current : prev
    )

    const referenceTimestamps = referenceData?.chart?.result?.[0]?.timestamp || []
    
    return {
      labels: referenceTimestamps.map(formatDate),
      datasets: chartData.map((data, index) => {
        const result = data.chart.result[0]
        const meta = result.meta
        const quotes = result.indicators.quote[0]
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

        // Align data with reference timestamps
        const alignedData = referenceTimestamps.map(ts => {
          const idx = result.timestamp.indexOf(ts)
          return idx !== -1 ? quotes.close[idx] : null
        })

        return {
          label: `${meta.symbol} - ${meta.shortName?.substring(0, 15) || ''}${meta.shortName?.length > 15 ? "..." : ""}`,
          data: alignedData,
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          pointRadius: range === '1d' ? 3 : 0,
          tension: 0.1,
          fill: {
            target: "origin",
            above: `${color}10`,
          },
        }
      })
    }
  }, [chartData, formatDate, range])

  // Chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
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
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(value)
        },
      },
    },
  }), [])

  // Handlers
  const handleRefresh = useCallback(() => {
    // Clear cache
    cache.current = {}
    fetchData()
  }, [fetchData])

  const handleRangeChange = useCallback((value: string) => {
    setRange(value)
    // Auto-adjust interval
    setInterval(value === '1d' ? '5m' : value === '5d' ? '1d' : '1wk')
  }, [])

  // Loading state
  if (loading && chartData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-card rounded-lg p-4 border">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  // Error state
  if (error && chartData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-card rounded-lg p-4 border flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full bg-card rounded-lg p-4 border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Investment Performance</h3>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleString(DateTime.DATETIME_MED)}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end">
          <div className="flex gap-2 w-full">
            <Select value={range} onValueChange={handleRangeChange}>
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
            
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS
                  .filter(option => {
                    if (range === '1d') return ['1m', '5m', '15m'].includes(option.value)
                    if (range === '5d') return ['1d'].includes(option.value)
                    return ['1d', '1wk', '1mo'].includes(option.value)
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
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="h-[350px] relative">
        {chartData.length > 0 ? (
          <>
            <Line options={chartOptions} data={chartDataConfig} />
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {activeInvestments.length > 0 
              ? "No chart data available" 
              : "No active investments to display"}
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div>
          {error && <span className="text-destructive">{error}</span>}
        </div>
        <div>Tip: Click legend items to toggle visibility</div>
      </div>
    </div>
  )
}

export default React.memo(PerformanceChart)