import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Line } from "react-chartjs-2"
import { ChartJSRegister, COLOR_PALETTE, getChartOptions } from "./chart-config"
import { Skeleton } from "@/Components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Button } from "@/Components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Investment } from "./investment"
import { DateTime } from "luxon"
import { getApiManager } from "./api-manager"


ChartJSRegister()

const RANGE_OPTIONS = [
  { value: '1d', label: '1 Day' },
  { value: '5d', label: '5 Days' },
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: '1y', label: '1 Year' },
] as const

const INTERVAL_OPTIONS = [
  { value: '1d', label: '1 Day' },
  { value: '1wk', label: '1 Week' },
  { value: '1mo', label: '1 Month' },
] as const

interface PerformanceChartProps {
  investments: Investment[]
  className?: string
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ investments, className }) => {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<typeof RANGE_OPTIONS[number]['value']>('1mo')
  const [interval, setInterval] = useState<typeof INTERVAL_OPTIONS[number]['value']>('1d')
  const [lastRefresh, setLastRefresh] = useState<DateTime | null>(null)
  
  const apiManager = useMemo(() => getApiManager([
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_1!,
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_2!,
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY_3!,
  ]), [])

  const activeInvestments = useMemo(
    () => investments.filter(inv => !inv.sellPrice),
    [investments]
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeInvestments.length === 0) {
        setChartData([])
        setLastRefresh(DateTime.now())
        return
      }

      const results = await Promise.allSettled(
        activeInvestments.map(inv => 
          apiManager.getChartData(inv.symbol, range, interval)
        )
      )

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

      setChartData(successfulData)
      setLastRefresh(DateTime.now())

      if (errors.length > 0) {
        setError(`Failed to load ${errors.length}/${activeInvestments.length}`)
        toast.warning('Partial data loaded', {
          description: `Failed to load ${errors.length} investments`
        })
      } else if (successfulData.length > 0) {
        toast.success('Data loaded successfully')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [activeInvestments, range, interval, apiManager])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const handleRangeChange = useCallback((value: typeof RANGE_OPTIONS[number]['value']) => {
    setRange(value)
    // Auto-adjust interval based on range
    setInterval(value === '1d' ? '1d' : value === '5d' ? '1d' : '1wk')
  }, [])

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
        const investment = activeInvestments[index]

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
          fill: { target: "origin", above: `${color}10` },
          investment
        }
      })
    }
  }, [chartData, formatDate, range, activeInvestments])

  const currency = useMemo(() => {
    return activeInvestments.some(inv => inv.symbol.includes('.NS')) ? 'INR' : 'USD'
  }, [activeInvestments])

  if (loading && chartData.length === 0) {
    return (
      <div className={`w-full h-[400px] bg-card rounded-lg p-4 border ${className}`}>
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error && chartData.length === 0) {
    return (
      <div className={`w-full h-[400px] bg-card rounded-lg p-4 border flex flex-col items-center justify-center gap-4 ${className}`}>
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`w-full bg-card rounded-lg p-4 border ${className}`}>
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
                    if (range === '1d') return option.value === '1d'
                    if (range === '5d') return option.value === '1d'
                    return ['1wk', '1mo'].includes(option.value)
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
            <Line 
              options={getChartOptions(range, currency)} 
              data={chartDataConfig} 
            />
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