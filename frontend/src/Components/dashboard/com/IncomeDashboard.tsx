/** @format */
"use client"

import React, { useEffect, useRef } from "react"
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
} from "chart.js"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { selectAverageIncome, selectCategories, selectCategoryData, selectLastMonthIncome, selectMonthlyIncomeData, selectPaginatedIncomes, selectTotalIncome } from "@/lib/Redux/features/income/incomeSlices"


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const IncomeDashboard = () => {
  // Animation controls
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold: 0.1 })
  const chartRef = useRef(null)

  // Get data from Redux store
  const totalIncome = useAppSelector(selectTotalIncome)
  const lastMonthIncome = useAppSelector(selectLastMonthIncome)
  const averageIncome = useAppSelector(selectAverageIncome)
  const categories = useAppSelector(selectCategories)
  const transactions = useAppSelector(selectPaginatedIncomes)
  const categoryData = useAppSelector(selectCategoryData)
  const monthlyData = useAppSelector(selectMonthlyIncomeData)

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  // Chart data
  const barChartData = {
    labels: categoryData.map((item) => item.name),
    datasets: [
      {
        label: "Income by Category",
        data: categoryData.map((item) => item.value),
        backgroundColor: [
          "rgba(67, 97, 238, 0.8)",
          "rgba(63, 55, 201, 0.8)",
          "rgba(76, 201, 240, 0.8)",
          "rgba(72, 149, 239, 0.8)",
          "rgba(86, 11, 173, 0.8)",
        ],
        borderColor: [
          "rgba(67, 97, 238, 1)",
          "rgba(63, 55, 201, 1)",
          "rgba(76, 201, 240, 1)",
          "rgba(72, 149, 239, 1)",
          "rgba(86, 11, 173, 1)",
        ],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const doughnutChartData = {
    labels: categoryData.map((item) => item.name),
    datasets: [
      {
        data: categoryData.map((item) => item.value),
        backgroundColor: [
          "rgba(67, 97, 238, 0.8)",
          "rgba(63, 55, 201, 0.8)",
          "rgba(76, 201, 240, 0.8)",
          "rgba(72, 149, 239, 0.8)",
          "rgba(86, 11, 173, 0.8)",
        ],
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 2,
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
            return ` ${context.parsed.y || context.parsed}: ${formatCurrency(
              context.parsed.y || context.parsed
            )}`
          },
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart" as const,
    },
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString("default", { month: "short" })
    const year = date.getFullYear()

    const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"

    return `${day}${suffix} ${month} ${year}`
  }

  const TrendIcon = ({ trend }: { trend: "up" | "down" }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={trend === "up" ? "text-green-500" : "text-red-500"}>
      {trend === "up" ? (
        <path
          d="M5 15L12 8L19 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M19 9L12 16L5 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )

  // Summary data with trends
  const summaryData: {
      category: string;
      total: number;
      trend: "up" | "down";
      changePercent: number;
    }[] = [
      {
        category: "Total Income",
        total: totalIncome,
        trend: totalIncome > 0 ? "up" : "down",
        changePercent: 12, // You would calculate this from your data
      },
      {
        category: "Last Month",
        total: lastMonthIncome,
        trend: lastMonthIncome > 0 ? "up" : "down",
        changePercent: 8, // You would calculate this from your data
      },
      {
        category: "Average Income",
        total: averageIncome,
        trend: averageIncome > 0 ? "up" : "down",
        changePercent: 5, // You would calculate this from your data
      },
    ]

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 20 },
      }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Income Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {summaryData.map((summary, index) => (
          <motion.div
            key={summary.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${
              index === 0
                ? "from-blue-500 to-indigo-600"
                : index === 1
                ? "from-purple-500 to-pink-500"
                : "from-green-500 to-teal-500"
            } rounded-xl p-6 text-white shadow-lg`}>
            <div className="text-lg font-medium">{summary.category}</div>
            <div className="text-3xl font-bold my-3">
              {formatCurrency(summary.total)}
            </div>
            <div className="flex items-center space-x-2">
              <TrendIcon trend={summary.trend} />
              <span className="text-sm">
                {summary.changePercent}%{" "}
                {summary.trend === "up" ? "increase" : "decrease"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bar Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Income by Category
          </h3>
          <div className="h-80">
            <Bar ref={chartRef} data={barChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Income Distribution
          </h3>
          <div className="h-80">
            <Doughnut data={doughnutChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Monthly Trend Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Income Trend
        </h3>
        <div className="h-80">
          <Bar
            data={{
              labels: monthlyData.map((item) => item.name),
              datasets: [
                {
                  label: "Income",
                  data: monthlyData.map((item) => item.income),
                  backgroundColor: "rgba(67, 97, 238, 0.8)",
                  borderColor: "rgba(67, 97, 238, 1)",
                  borderWidth: 1,
                  borderRadius: 6,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </motion.div>

      {/* Transactions Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Recent Transactions
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.slice(0,5).map((transaction, index) => (
            <motion.div
              key={index}
              whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
              className="flex justify-between items-center p-4 md:p-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 rounded-lg ${
                    index % 2 === 0 ? "bg-blue-50" : "bg-indigo-50"
                  }`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={
                      transaction.type === "CREDIT" || "INCOME"
                        ? "text-green-500"
                        : "text-red-500"
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
                  <h4 className="font-medium text-gray-800">
                    {transaction.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(transaction.date)} • {transaction.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${
                    transaction.type === "CREDIT" || "INCOME"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {transaction.type === "CREDIT" || "INCOME" ? "+" : "-"}
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
