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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Button } from "@/Components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Investment } from "./investment"
import { DateTime } from "luxon"

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
] as const

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

interface PerformanceChartProps {
  investments: Investment[]
}

// Cache implementation
class ChartDataCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private ttl: number

  constructor(ttl: number) {
    this.ttl = ttl
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const API_RETRY_DELAY = 1000 // 1 second
const MAX_RETRIES = 3
const MAX_CONCURRENT_REQUESTS = 3

const PerformanceChart: React.FC<PerformanceChartProps> = ({ investments = [] }) => {
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
  const cache = useRef(new ChartDataCache(CACHE_TTL))
  const activeRequests = useRef<Set<string>>(new Set())
  const requestQueue = useRef<Array<() => Promise<void>>>([])
  const isMounted = useRef(true)
  const apiKeyStatus = useRef<Record<string, { failures: number; lastUsed: number }>>({})

  // API Keys configuration
  const API_KEYS = useMemo(() => [
    process.env.NEXT_PUBLIC_RAPIDAPI1,
    process.env.NEXT_PUBLIC_RAPIDAPI2,
    process.env.NEXT_PUBLIC_RAPIDAPI3,
    process.env.NEXT_PUBLIC_RAPIDAPI4,
    process.env.NEXT_PUBLIC_RAPIDAPI5,
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
      .sort((a, b) => {
        // Prefer keys with fewer failures
        if (a[1].failures !== b[1].failures) {
          return a[1].failures - b[1].failures
        }
        // Then prefer least recently used
        return a[1].lastUsed - b[1].lastUsed
      })

    return availableKeys[0]?.[0] || null
  }, [])

  // Process the request queue
  const processQueue = useCallback(() => {
    while (requestQueue.current.length > 0 && activeRequests.current.size < MAX_CONCURRENT_REQUESTS) {
      const task = requestQueue.current.shift()
      if (task) {
        const requestId = Date.now().toString()
        activeRequests.current.add(requestId)
        task().finally(() => {
          activeRequests.current.delete(requestId)
          if (isMounted.current) {
            processQueue()
          }
        })
      }
    }
  }, [])

  // Enhanced fetch function with queue management
  const fetchStockChartData = useCallback(async (symbol: string): Promise<any> => {
    const cacheKey = `${symbol}-${range}-${interval}`
    const cachedData = cache.current.get(cacheKey)
    if (cachedData) return cachedData

    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        const apiKey = getBestApiKey()
        if (!apiKey) {
          reject(new Error('No available API keys'))
          return
        }

        try {
          // Update API key status
          apiKeyStatus.current[apiKey] = {
            ...apiKeyStatus.current[apiKey],
            lastUsed: Date.now()
          }

          const params = new URLSearchParams({
            symbol,
            range,
            interval,
            region: symbol.includes('.NS') ? 'IN' : 'US'
          })

          const response = await fetch(`https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart?${params}`, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com'
            }
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid data structure')
          }

          // Update cache
          cache.current.set(cacheKey, data)

          // Reset failure count for this key
          if (apiKeyStatus.current[apiKey]) {
            apiKeyStatus.current[apiKey] = {
              ...apiKeyStatus.current[apiKey],
              failures: 0
            }
          }

          resolve(data)
        } catch (error) {
          // Update failure count for this key
          if (apiKey && apiKeyStatus.current[apiKey]) {
            apiKeyStatus.current[apiKey] = {
              ...apiKeyStatus.current[apiKey],
              failures: (apiKeyStatus.current[apiKey].failures || 0) + 1
            }
          }

          reject(error)
        }
      }

      requestQueue.current.push(executeRequest)
      processQueue()
    })
  }, [range, interval, getBestApiKey, processQueue])

  // Fetch data for all active investments
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return

    try {
      setLoading(true)
      setError(null)

      if (activeInvestments.length === 0) {
        setChartData([])
        setLastRefresh(DateTime.now())
        setLoading(false)
        return
      }

      // Process in batches to avoid overwhelming the API
      const BATCH_SIZE = 3
      const successfulData: any[] = []
      const errors: string[] = []

      for (let i = 0; i < activeInvestments.length; i += BATCH_SIZE) {
        const batch = activeInvestments.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(inv => fetchStockChartData(inv.symbol)))
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successfulData.push(result.value)
          } else {
            const symbol = batch[index]?.symbol || 'Unknown'
            errors.push(`${symbol}: ${result.reason instanceof Error ? result.reason.message : 'Failed to load'}`)
          }
        })

        // Add delay between batches if needed
        if (i + BATCH_SIZE < activeInvestments.length) {
          await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY))
        }
      }

      if (isMounted.current) {
        if (successfulData.length > 0) {
          setChartData(successfulData)
          setLastRefresh(DateTime.now())
        }

        if (errors.length > 0) {
          setError(`Failed to load ${errors.length} investments`)
          toast.warning(
            `Loaded ${successfulData.length} of ${activeInvestments.length} investments`,
            {
              description: errors.length > 3 
                ? `${errors.length} investments failed to load` 
                : `Failed to load: ${errors.join(', ')}`
            }
          )
        } else if (successfulData.length > 0) {
          toast.success('Investment data loaded successfully')
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
  }, [fetchData, range, interval])

  // Date formatting
  const formatDate = useCallback((timestamp: number) => {
    const date = DateTime.fromSeconds(timestamp)
    switch (range) {
      case '1d': return date.toFormat('HH:mm')
      case '5d': return date.toFormat('MMM dd')
      case '1mo': return date.toFormat('MMM dd')
      case '3mo': return date.toFormat('MMM')
      case '6mo': return date.toFormat('MMM')
      default: return date.toFormat('MMM yyyy')
    }
  }, [range])

  // Prepare chart data - normalize all datasets to same timestamps
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

    // Find the dataset with the most data points to use as reference
    const referenceData = chartData.reduce((prev, current) => {
      const prevLength = prev?.chart?.result?.[0]?.timestamp?.length || 0
      const currentLength = current?.chart?.result?.[0]?.timestamp?.length || 0
      return currentLength > prevLength ? current : prev
    })

    const referenceTimestamps = referenceData?.chart?.result?.[0]?.timestamp || []
    const referenceQuotes = referenceData?.chart?.result?.[0]?.indicators?.quote?.[0]
    
    return {
      labels: referenceTimestamps.map(formatDate),
      datasets: chartData.map((data, index) => {
        const result = data.chart.result[0]
        const meta = result.meta
        const quotes = result.indicators.quote[0]
        const inv = activeInvestments.find(i => i.symbol === meta.symbol)
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length]

        // Align data points with reference timestamps
        const alignedData = referenceTimestamps.map((ts, i) => {
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
          pointHoverRadius: 5,
          tension: 0.1,
          fill: {
            target: "origin",
            above: `${color}10`,
          },
        }
      }).filter(Boolean),
    }
  }, [chartData, activeInvestments, formatDate, range])

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
      title: {
        display: true,
        text: `Performance (${RANGE_OPTIONS.find(r => r.value === range)?.label})`,
        font: { size: 16, weight: "bold" },
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
  }), [range])

  // Handlers
  const handleRefresh = useCallback(() => {
    // Clear cache for current range/interval
    activeInvestments.forEach(inv => {
      const cacheKey = `${inv.symbol}-${range}-${interval}`
      cache.current.delete(cacheKey)
    })
    fetchData()
  }, [fetchData, activeInvestments, range, interval])

  const handleRangeChange = useCallback((value: string) => {
    setRange(value)
    // Auto-adjust interval based on range
    setInterval(value === '1d' ? '5m' : value === '5d' ? '1d' : '1wk')
  }, [])

  // Loading and error states
  if (loading && chartData.length === 0) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error && chartData.length === 0) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
                    if (range === '5d') return ['1h', '1d'].includes(option.value)
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
      
      <div className="h-[400px] relative">
        {chartData.length > 0 ? (
          <>
            <Line options={chartOptions} data={chartDataConfig} />
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {activeInvestments.length > 0 
              ? "No chart data available" 
              : "No active investments to display"}
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-2">
        <div className="text-xs text-muted-foreground">
          {error && (
            <span className="text-red-500">Some data may not be available. {error}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Tip: Click legend items to toggle visibility.
        </div>
      </div>
    </div>
  )
}

export default React.memo(PerformanceChart)