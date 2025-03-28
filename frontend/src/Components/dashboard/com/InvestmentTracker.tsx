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

interface Stock {
  id: string
  symbol: string
  name: string
  purchaseDate: string
  purchasePrice: number
  quantity: number
  currentPrice?: number
  historicalData?: { date: string; price: number }[]
}

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  bestPerformer: Stock | null
  worstPerformer: Stock | null
}

const ALPHA_VANTAGE_API_KEY = "OJ70GQQ5VNXD2WWW" // Replace with your actual key
const API_RATE_LIMIT_DELAY = 65000 // 65 seconds delay between batches (free tier allows 5 requests/minute)

const InvestmentTracker = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("1m")
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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

  const getDataPointsForRange = (range: string): number => {
    switch (range) {
      case "1m":
        return 30
      case "3m":
        return 90
      case "6m":
        return 180
      case "1y":
        return 365
      default:
        return 30
    }
  }

  // Generate mock historical data with realistic trends
  const generateMockHistoricalData = (symbol: string, days: number) => {
    const stock = initialStocks.find((s) => s.symbol === symbol)
    const basePrice = stock?.purchasePrice || 100
    const trend = Math.random() > 0.5 ? 1 : -1 // Random upward or downward trend

    return Array.from({ length: days }, (_, i) => {
      const daysAgo = days - i
      // Simulate price movement with some randomness
      const priceChange =
        trend * 0.001 * daysAgo + (Math.random() * 0.005 - 0.0025)
      return {
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        price: basePrice * (1 + priceChange),
      }
    })
  }

  // Enhanced API Functions with comprehensive error handling
  const fetchCurrentPrice = async (symbol: string): Promise<number> => {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      )

      // Check for rate limiting
      if (response.data.Note) {
        throw new Error("API rate limit exceeded")
      }

      // Check for error message
      if (response.data["Error Message"]) {
        throw new Error(response.data["Error Message"])
      }

      // Handle different possible response structures
      const quoteData =
        response.data["Global Quote"] ||
        response.data["Realtime Global Securities Quote"] ||
        response.data

      // Try different possible price field names
      const price =
        quoteData["05. price"] ||
        quoteData["price"] ||
        quoteData["Price"] ||
        quoteData["latestPrice"] ||
        null

      if (price !== null) {
        return parseFloat(price)
      }

      throw new Error("No valid price data found in response")
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error)
      // Return purchase price as fallback
      const stock = initialStocks.find((s) => s.symbol === symbol)
      return stock?.purchasePrice || 100
    }
  }

  const fetchHistoricalData = async (
    symbol: string
  ): Promise<{ date: string; price: number }[]> => {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${
          timeRange === "1y" ? "full" : "compact"
        }&apikey=${ALPHA_VANTAGE_API_KEY}`
      )

      // Check for rate limiting
      if (response.data.Note) {
        throw new Error("API rate limit exceeded")
      }

      // Check for error message
      if (response.data["Error Message"]) {
        throw new Error(response.data["Error Message"])
      }

      // Find the time series key in the response (it might vary)
      const timeSeriesKey = Object.keys(response.data).find(
        (key) =>
          key.toLowerCase().includes("time series") ||
          key.toLowerCase().includes("timeseries")
      )

      if (!timeSeriesKey) {
        throw new Error("No time series data found in response")
      }

      const timeSeries = response.data[timeSeriesKey]
      if (!timeSeries || typeof timeSeries !== "object") {
        throw new Error("Time series data is invalid")
      }

      // Process historical data with multiple fallback options
      const historicalData = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => {
          // Try different possible price field names
          const price =
            values["4. close"] ||
            values["5. adjusted close"] ||
            values["close"] ||
            values["Close"] ||
            values["price"] ||
            0
          return {
            date,
            price: parseFloat(price) || 0,
          }
        })
        .filter((item) => item.price > 0) // Filter out invalid prices
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-getDataPointsForRange(timeRange))

      if (historicalData.length === 0) {
        throw new Error("No valid historical data points found")
      }

      return historicalData
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      // Generate realistic mock data if API fails
      return generateMockHistoricalData(
        symbol,
        getDataPointsForRange(timeRange)
      )
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

  // Data fetching with rate limiting and comprehensive error handling
  const fetchStockData = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      const updatedStocks: Stock[] = []
      const BATCH_SIZE = 2 // Conservative batch size for free tier

      for (let i = 0; i < initialStocks.length; i += BATCH_SIZE) {
        const batch = initialStocks.slice(i, i + BATCH_SIZE)

        const batchResults = await Promise.all(
          batch.map(async (stock) => {
            try {
              const [currentPrice, historicalData] = await Promise.all([
                fetchCurrentPrice(stock.symbol),
                fetchHistoricalData(stock.symbol),
              ])

              return {
                ...stock,
                currentPrice,
                historicalData,
              }
            } catch (error) {
              console.error(`Error processing ${stock.symbol}:`, error)
              // Return stock with mock data if API fails
              return {
                ...stock,
                currentPrice: stock.purchasePrice * (0.9 + Math.random() * 0.2), // Random price ±10%
                historicalData: generateMockHistoricalData(
                  stock.symbol,
                  getDataPointsForRange(timeRange)
                ),
              }
            }
          })
        )

        updatedStocks.push(...batchResults)

        // Add delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < initialStocks.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, API_RATE_LIMIT_DELAY)
          )
        }
      }

      setStocks(updatedStocks)
      calculateSummary(updatedStocks)
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error("Error fetching stock data:", error)
      setApiError(
        "Some data may not be current. Using fallback values where needed."
      )
      // Set stocks with mock data
      const stocksWithFallback = initialStocks.map((stock) => ({
        ...stock,
        currentPrice: stock.purchasePrice * (0.9 + Math.random() * 0.2), // Random price ±10%
        historicalData: generateMockHistoricalData(
          stock.symbol,
          getDataPointsForRange(timeRange)
        ),
      }))
      setStocks(stocksWithFallback)
      calculateSummary(stocksWithFallback)
    } finally {
      setLoading(false)
    }
  }, [timeRange, calculateSummary])

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

      {/* Error message */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
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
              {summary ? formatPercentage(summary.profitLossPercentage) : "--"}
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
            <div className="flex space-x-2">
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
          <h3 className="text-xl font-semibold text-gray-800">Your Holdings</h3>
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
                  (stock.currentPrice || stock.purchasePrice) * stock.quantity
                const profitLoss = currentValue - invested
                const profitLossPercentage = (profitLoss / invested) * 100

                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {stock.symbol}
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
