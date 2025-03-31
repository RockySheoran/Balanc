/** @format */

import React, { useState, useEffect, useCallback } from "react"
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
} from "chart.js"
import { motion } from "framer-motion"
import axios from "axios"
import {
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Types
interface Stock {
  id: string
  symbol: string
  name: string
  purchaseDate: string
  purchasePrice: number
  quantity: number
  currentPrice?: number
  historicalData?: { date: string; price: number }[]
  error?: string
}

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  bestPerformer: Stock | null
  worstPerformer: Stock | null
}

// API Configuration
const API_CONFIG = {
  alphaVantage: {
    key: "OJ70GQQ5VNXD2WWW",
    rateLimit: 5, // Requests per minute
  },
  yahooFinance: {
    rateLimit: 100, // Requests per minute
  },
  iexCloud: {
    key: "YOUR_IEX_KEY",
    rateLimit: 100, // Requests per minute
  },
  twelveData: {
    key: "OQa66tuHM_zaYvqjLRNjMSnePvIwsBOe",
    rateLimit: 8, // Requests per minute
  },
}

const InvestmentTracker = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("1m")
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [apiUsage, setApiUsage] = useState<Record<string, number>>({})

  // Sample portfolio data
  const initialStocks: Stock[] = [
    {
      id: "1",
      symbol: "AAPL",
      name: "Apple Inc.",
      purchaseDate: "2023-01-15",
      purchasePrice: 150.25,
      quantity: 10,
    },
    {
      id: "2",
      symbol: "MSFT",
      name: "Microsoft Corporation",
      purchaseDate: "2023-02-20",
      purchasePrice: 250.5,
      quantity: 5,
    },
    {
      id: "3",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      purchaseDate: "2023-03-10",
      purchasePrice: 105.75,
      quantity: 8,
    },
  ]

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

  // API Service with fallback mechanism
  class StockDataService {
    private static instance: StockDataService
    private apiQueue: (() => Promise<void>)[] = []
    private isProcessing = false

    private constructor() {}

    public static getInstance(): StockDataService {
      if (!StockDataService.instance) {
        StockDataService.instance = new StockDataService()
      }
      return StockDataService.instance
    }

    private async processQueue() {
      if (this.isProcessing || this.apiQueue.length === 0) return

      this.isProcessing = true
      const task = this.apiQueue.shift()
      if (task) {
        await task()
        setTimeout(() => {
          this.isProcessing = false
          this.processQueue()
        }, (1000 / API_CONFIG.alphaVantage.rateLimit) * 60) // Rate limiting
      }
    }

    public async fetchStockData(symbol: string): Promise<{
      currentPrice: number | null
      historicalData: { date: string; price: number }[] | null
      error: string | null
    }> {
      return new Promise((resolve) => {
        this.apiQueue.push(async () => {
          try {
            // Try Alpha Vantage first
            let result = await this.fetchAlphaVantage(symbol)
            if (!result.error) return resolve(result)

            // Fallback to Yahoo Finance
            result = await this.fetchYahooFinance(symbol)
            if (!result.error) return resolve(result)

            // Fallback to IEX Cloud
            result = await this.fetchIEXCloud(symbol)
            if (!result.error) return resolve(result)

            // Fallback to Twelve Data
            result = await this.fetchTwelveData(symbol)
            if (!result.error) return resolve(result)

            // All APIs failed
            resolve({
              currentPrice: null,
              historicalData: null,
              error: "All API attempts failed",
            })
          } catch (error) {
            resolve({
              currentPrice: null,
              historicalData: null,
              error: "Unexpected error occurred",
            })
          }
        })
        this.processQueue()
      })
    }

    private async fetchAlphaVantage(symbol: string) {
      try {
        const [currentResponse, historicalResponse] = await Promise.all([
          axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.alphaVantage.key}`
          ),
          axios.get(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_CONFIG.alphaVantage.key}`
          ),
        ])

        // Handle rate limiting
        if (currentResponse.data.Note || historicalResponse.data.Note) {
          throw new Error("API rate limit reached")
        }

        // Process current price
        const quoteData = currentResponse.data["Global Quote"] || {}
        const currentPrice = parseFloat(quoteData["05. price"]) || null

        // Process historical data
        const timeSeriesKey = Object.keys(historicalResponse.data).find((key) =>
          key.includes("Time Series")
        )
        const historicalData = timeSeriesKey
          ? Object.entries(historicalResponse.data[timeSeriesKey])
              .map(([date, values]: [string, any]) => ({
                date,
                price: parseFloat(values["4. close"]),
              }))
              .slice(0, 30)
          : null

        return {
          currentPrice,
          historicalData,
          error: null,
        }
      } catch (error) {
        return {
          currentPrice: null,
          historicalData: null,
          error: "Alpha Vantage: " + (error as Error).message,
        }
      }
    }

    private async fetchYahooFinance(symbol: string) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
        )

        const result = response.data.chart.result[0]
        const currentPrice = result.meta.regularMarketPrice
        const historicalData = result.timestamp.map((t: number, i: number) => ({
          date: new Date(t * 1000).toISOString().split("T")[0],
          price: result.indicators.quote[0].close[i],
        }))

        return {
          currentPrice,
          historicalData,
          error: null,
        }
      } catch (error) {
        return {
          currentPrice: null,
          historicalData: null,
          error: "Yahoo Finance: " + (error as Error).message,
        }
      }
    }

    private async fetchIEXCloud(symbol: string) {
      try {
        const response = await axios.get(
          `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${API_CONFIG.iexCloud.key}`
        )

        return {
          currentPrice: response.data.latestPrice,
          historicalData: null, // IEX Cloud would need separate call for historical
          error: null,
        }
      } catch (error) {
        return {
          currentPrice: null,
          historicalData: null,
          error: "IEX Cloud: " + (error as Error).message,
        }
      }
    }

    private async fetchTwelveData(symbol: string) {
      try {
        const response = await axios.get(
          `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_CONFIG.twelveData.key}`
        )

        return {
          currentPrice: parseFloat(response.data.price),
          historicalData: null, // Twelve Data would need separate call for historical
          error: null,
        }
      } catch (error) {
        return {
          currentPrice: null,
          historicalData: null,
          error: "Twelve Data: " + (error as Error).message,
        }
      }
    }
  }

  // Portfolio calculations
  const calculateSummary = useCallback((stocksData: Stock[]) => {
    const totalInvested = stocksData.reduce(
      (sum, stock) => sum + stock.purchasePrice * stock.quantity,
      0
    )

    const currentValue = stocksData.reduce(
      (sum, stock) =>
        sum + (stock.currentPrice || stock.purchasePrice) * stock.quantity,
      0
    )

    const profitLoss = currentValue - totalInvested
    const profitLossPercentage = (profitLoss / totalInvested) * 100

    const performers = stocksData
      .map((stock) => ({
        ...stock,
        performance:
          (((stock.currentPrice || stock.purchasePrice) - stock.purchasePrice) /
            stock.purchasePrice) *
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

  // Data fetching with enhanced error handling
  const fetchStockData = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      const stockService = StockDataService.getInstance()
      const updatedStocks: Stock[] = []
      const errors: Record<string, string> = {}

      for (const stock of initialStocks) {
        try {
          const { currentPrice, historicalData, error } =
            await stockService.fetchStockData(stock.symbol)

          updatedStocks.push({
            ...stock,
            currentPrice: currentPrice || stock.purchasePrice,
            historicalData:
              historicalData || generateHistoricalData(stock, timeRange),
            error: error || undefined,
          })

          if (error) {
            errors[stock.symbol] = error
          }
        } catch (error) {
          updatedStocks.push({
            ...stock,
            currentPrice: stock.purchasePrice,
            historicalData: generateHistoricalData(stock, timeRange),
            error: `Failed to fetch data: ${(error as Error).message}`,
          })
          errors[stock.symbol] = (error as Error).message
        }
      }

      setStocks(updatedStocks)
      calculateSummary(updatedStocks)
      setLastUpdated(new Date().toISOString())

      if (Object.keys(errors).length > 0) {
        setApiError(
          `Partial data loaded. ${
            Object.keys(errors).length
          } stocks have issues.`
        )
      }
    } catch (error) {
      setApiError(`Failed to fetch portfolio data: ${(error as Error).message}`)
      // Set stocks with fallback data
      const stocksWithFallback = initialStocks.map((stock) => ({
        ...stock,
        currentPrice: stock.purchasePrice,
        historicalData: generateHistoricalData(stock, timeRange),
        error: `Failed to fetch data: ${(error as Error).message}`,
      }))
      setStocks(stocksWithFallback)
      calculateSummary(stocksWithFallback)
    } finally {
      setLoading(false)
    }
  }, [timeRange, calculateSummary])

  // Generate realistic historical data
  const generateHistoricalData = (stock: Stock, range: string) => {
    const days =
      range === "1m" ? 30 : range === "3m" ? 90 : range === "6m" ? 180 : 365
    const basePrice = stock.purchasePrice
    const volatility = 0.02 // 2% daily volatility

    return Array.from({ length: days }, (_, i) => {
      const daysAgo = days - i - 1
      const randomFactor = 1 + (Math.random() * 2 - 1) * volatility
      const trend = 1 + i * 0.0005 // Slight upward trend over time

      return {
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        price: basePrice * trend * randomFactor,
      }
    }).reverse()
  }

  // Initial data load
  useEffect(() => {
    fetchStockData()
  }, [fetchStockData])

  // Chart data preparation
  const lineChartData = {
    labels: stocks[0]?.historicalData?.map((data) => data.date) || [],
    datasets: stocks.map((stock) => ({
      label: `${stock.symbol} - ${stock.name}`,
      data: stock.historicalData?.map((data) => data.price) || [],
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      tension: 0.3,
      pointRadius: 0,
    })),
  }

  const pieChartData = {
    labels: stocks.map((stock) => stock.symbol),
    datasets: [
      {
        data: stocks.map(
          (stock) =>
            (stock.currentPrice || stock.purchasePrice) * stock.quantity
        ),
        backgroundColor: stocks.map(
          () => `hsl(${Math.random() * 360}, 70%, 50%)`
        ),
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
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
          <button
            onClick={fetchStockData}
            disabled={loading}
            className={`flex items-center px-4 py-2 rounded-md ${
              loading
                ? "bg-gray-200"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}>
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Refresh Data
              </>
            )}
          </button>
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

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64 mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Content when not loading */}
      {!loading && (
        <>
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
            </motion.div>

            {/* Profit/Loss */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
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
                  {summary
                    ? formatPercentage(summary.profitLossPercentage)
                    : "--"}
                </span>
              </div>
            </motion.div>

            {/* Best Performer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500 font-medium">Best Performer</h3>
                <div className="p-2 rounded-full bg-purple-50 text-purple-500">
                  <FiArrowUp size={20} />
                </div>
              </div>
              {summary?.bestPerformer ? (
                <div className="mt-2">
                  <p className="text-xl font-bold text-gray-900">
                    {summary.bestPerformer.symbol}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.bestPerformer.name}
                  </p>
                  <p className="text-green-500 font-medium mt-1">
                    +
                    {(
                      (((summary.bestPerformer.currentPrice ||
                        summary.bestPerformer.purchasePrice) -
                        summary.bestPerformer.purchasePrice) /
                        summary.bestPerformer.purchasePrice) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                  {summary.bestPerformer.error && (
                    <p className="text-xs text-red-500 mt-1">
                      <FiAlertTriangle className="inline mr-1" />
                      {summary.bestPerformer.error}
                    </p>
                  )}
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
                  Portfolio Performance
                </h3>
                <div className="flex space-x-2 over">
                  {["1m", "3m", "6m", "1y"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timeRange === range
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {range}
                    </button>
                  ))}
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
                Portfolio Allocation
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
                Your Holdings
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
                  {stocks.map((stock) => {
                    const invested = stock.purchasePrice * stock.quantity
                    const currentValue =
                      (stock.currentPrice || stock.purchasePrice) *
                      stock.quantity
                    const profitLoss = currentValue - invested
                    const profitLossPercentage = (profitLoss / invested) * 100

                    return (
                      <tr key={stock.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {stock.symbol}
                          {stock.error && (
                            <div className="text-xs text-red-500 mt-1">
                              <FiAlertTriangle className="inline mr-1" />
                              {stock.error}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {stock.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {formatDate(stock.purchaseDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {formatCurrency(stock.purchasePrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {stock.currentPrice
                            ? formatCurrency(stock.currentPrice)
                            : "--"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {stock.quantity}
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
                              profitLoss >= 0
                                ? "text-green-500"
                                : "text-red-500"
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
        </>
      )}
    </div>
  )
}

export default InvestmentTracker
