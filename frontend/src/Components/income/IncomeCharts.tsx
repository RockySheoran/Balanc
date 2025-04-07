/** @format */
"use client"

import { motion } from "framer-motion"
import { memo, useCallback, useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  selectCategories,
  selectTotalIncome,
  selectMonthlyIncomeData,
  selectCategoryData,
} from "@/lib/Redux/features/income/incomeSlices"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import LoadingSpinner from "../expense/LoadingSpinner"


const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

const IncomeCharts = memo(() => {
  // Memoized selectors
  const categories = useAppSelector(selectCategories)
  const totalIncome = useAppSelector(selectTotalIncome)
  const rawCategoryData = useAppSelector(selectCategoryData)
  const rawMonthlyData = useAppSelector(selectMonthlyIncomeData)

  // Process and memoize chart data
  const categoryData = useMemo(() => {
    if (!rawCategoryData) return []
    return rawCategoryData.map((item) => ({
      ...item,
      value: Number(item.value.toFixed(2)),
    }))
  }, [rawCategoryData])

  const monthlyData = useMemo(() => {
    if (!rawMonthlyData) return []
    return rawMonthlyData.map((item) => ({
      ...item,
      income: Number(item.income.toFixed(2)),
      expense: Number(item.expense.toFixed(2)),
    }))
  }, [rawMonthlyData])

  // Current year for display
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  // Custom tooltip formatter
  const currencyFormatter = useCallback(
    (value: number) => [`$${value.toFixed(2)}`, "Amount"],
    []
  )

  // Pie chart label formatter
  const renderPieLabel = useCallback(
    ({ name, percent }: { name: string; percent: number }) =>
      `${name}: ${(percent * 100).toFixed(0)}%`,
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-8">
      <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-4">
        Income Analytics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            By Category ({currentYear})
          </h3>
          <div className="h-64">
            {categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderPieLabel}>
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={currencyFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <LoadingSpinner  />
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Monthly Trend ({currentYear})
          </h3>
          <div className="h-64">
            {monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" stroke="#888" tick={{ fill: "#888" }} />
                  <YAxis stroke="#888" tick={{ fill: "#888" }} />
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderColor: "#eee",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="#4f46e5"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#ec4899"
                    name="Expense"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
})

IncomeCharts.displayName = "IncomeCharts"
export default IncomeCharts
