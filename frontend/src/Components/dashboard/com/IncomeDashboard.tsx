/** @format */

"use client"

import React, { useMemo, useRef } from "react"
import { Bar, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js"
import { motion, useAnimationControls } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import {
  selectAverageIncome,
  selectCategories,
  selectCategoryData,
  selectLastMonthIncome,
  selectMonthlyIncomeData,
  selectPaginatedIncomes,
  selectTotalIncome,
} from "@/lib/Redux/features/income/incomeSlices"
import { Income } from "@/types/income"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Type definitions
type SummaryItem = {
  category: string
  total: number
  trend: "up" | "down"
  changePercent: number
}

type TrendIconProps = {
  trend: "up" | "down"
}

const COLORS = {
  primary: {
    500: "rgba(67, 97, 238, 0.8)",
    600: "rgba(67, 97, 238, 1)",
  },
  secondary: {
    500: "rgba(63, 55, 201, 0.8)",
    600: "rgba(63, 55, 201, 1)",
  },
  accent: {
    500: "rgba(76, 201, 240, 0.8)",
    600: "rgba(76, 201, 240, 1)",
  },
  success: {
    500: "rgba(72, 187, 120, 0.8)",
    600: "rgba(72, 187, 120, 1)",
  },
  warning: {
    500: "rgba(247, 144, 9, 0.8)",
    600: "rgba(247, 144, 9, 1)",
  },
  gradient: {
    blueIndigo: "from-blue-500 to-indigo-600",
    purplePink: "from-purple-500 to-pink-500",
    greenTeal: "from-green-500 to-teal-500",
  },
}

const IncomeDashboard = () => {
  // Animation controls
  const controls = useAnimationControls()
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })
  const chartRef = useRef(null)

  // Get data from Redux store
  const totalIncome = useAppSelector(selectTotalIncome)
  const lastMonthIncome = useAppSelector(selectLastMonthIncome)
  const averageIncome = useAppSelector(selectAverageIncome)
  const categoryData = useAppSelector(selectCategoryData)
  const transactions = useAppSelector(selectPaginatedIncomes)
  const monthlyData = useAppSelector(selectMonthlyIncomeData)

  // Memoized chart data to prevent unnecessary recalculations
  const { barChartData, doughnutChartData, monthlyChartData } = useMemo(() => {
    const chartColors = [
      COLORS.primary[500],
      COLORS.secondary[500],
      COLORS.accent[500],
      COLORS.success[500],
      COLORS.warning[500],
    ]

    const borderColors = [
      COLORS.primary[600],
      COLORS.secondary[600],
      COLORS.accent[600],
      COLORS.success[600],
      COLORS.warning[600],
    ]

    const barChartData: ChartData<"bar"> = {
      labels: categoryData.map((item) => item.name),
      datasets: [
        {
          label: "Income by Category",
          data: categoryData.map((item) => item.value),
          backgroundColor: chartColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }

    const doughnutChartData: ChartData<"doughnut"> = {
      labels: categoryData.map((item) => item.name),
      datasets: [
        {
          data: categoryData.map((item) => item.value),
          backgroundColor: chartColors,
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: 2,
        },
      ],
    }

    const monthlyChartData: ChartData<"bar"> = {
      labels: monthlyData.map((item) => item.name),
      datasets: [
        {
          label: "Income",
          data: monthlyData.map((item) => item.income),
          backgroundColor: COLORS.primary[500],
          borderColor: COLORS.primary[600],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }

    return { barChartData, doughnutChartData, monthlyChartData }
  }, [categoryData, monthlyData])

  // Chart options
  const chartOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? context.parsed
              return ` ${value}: ${formatCurrency(value)}`
            },
          },
          padding: 10,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart" as const,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    }),
    []
  )

  // Summary data with trends
  const summaryData: SummaryItem[] = useMemo(
    () => [
      {
        category: "Total Income",
        total: totalIncome,
        trend: totalIncome > 0 ? "up" : "down",
        changePercent: 12,
      },
      {
        category: "Last Month",
        total: lastMonthIncome,
        trend: lastMonthIncome > 0 ? "up" : "down",
        changePercent: 8,
      },
      {
        category: "Average Income",
        total: averageIncome,
        trend: averageIncome > 0 ? "up" : "down",
        changePercent: 5,
      },
    ],
    [totalIncome, lastMonthIncome, averageIncome]
  )

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
    return new Intl.DateTimeFormat("en-US", options).format(date)
  }

  // Trend icon component
  const TrendIcon = ({ trend }: TrendIconProps) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={trend === "up" ? "text-green-500" : "text-red-500"}>
      <path
        d={trend === "up" ? "M5 15L12 8L19 15" : "M19 9L12 16L5 9"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  // Recent transactions (limited to 5)
  const recentTransactions = useMemo(
    () =>
      transactions.slice(0, 5).map((transaction) => ({
        ...transaction,
        isIncome:
          transaction.type === "CREDIT" || transaction.type === "INCOME",
      })),
    [transactions]
  )

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 20 },
      }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 md:mb-8">
        Income Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {summaryData.map((summary, index) => {
          const gradientClass = [
            COLORS.gradient.blueIndigo,
            COLORS.gradient.purplePink,
            COLORS.gradient.greenTeal,
          ][index % 3]

          return (
            <motion.div
              key={summary.category}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${gradientClass} rounded-xl p-4 md:p-6 text-white shadow-lg`}
              whileHover={{ scale: 1.02 }}>
              <div className="text-sm md:text-lg font-medium">
                {summary.category}
              </div>
              <div className="text-2xl md:text-3xl font-bold my-2 md:my-3">
                {formatCurrency(summary.total)}
              </div>
              <div className="flex items-center space-x-2">
                <TrendIcon trend={summary.trend} />
                <span className="text-xs md:text-sm">
                  {summary.changePercent}%{" "}
                  {summary.trend === "up" ? "increase" : "decrease"}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
          className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Income by Category
          </h3>
          <div className="h-64 md:h-80">
            <Bar ref={chartRef} data={barChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Income Distribution
          </h3>
          <div className="h-64 md:h-80">
            <Doughnut data={doughnutChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Monthly Trend Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4 }}
        className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 mb-6 md:mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Income Trend
        </h3>
        <div className="h-64 md:h-80">
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Transactions Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
            Recent Transactions
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {recentTransactions.map((transaction, index) => (
            <motion.div
              key={`${transaction.id}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
              className="flex justify-between items-center p-3 md:p-4 lg:p-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div
                  className={`p-2 md:p-3 rounded-lg ${
                    index % 2 === 0 ? "bg-blue-50" : "bg-indigo-50"
                  }`}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={
                      transaction.isIncome ? "text-green-500" : "text-red-500"
                    }>
                    <path
                      d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-medium text-gray-800">
                    {transaction.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.date)} • {transaction.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm md:text-base font-medium ${
                    transaction.isIncome ? "text-green-600" : "text-red-600"
                  }`}>
                  {transaction.isIncome ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default IncomeDashboard
