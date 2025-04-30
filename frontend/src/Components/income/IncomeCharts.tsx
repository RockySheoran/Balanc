/** @format */
"use client"

import { motion } from "framer-motion"
import { memo, useCallback, useMemo, useState, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize() // Set initial value
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
    console.log(rawCategoryData)
    return rawMonthlyData.map((item) => (
   
      {
      ...item,
      income: Number(item.income.toFixed(2)),
    
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
    ({ name, percent }: { name: string; percent: number }) => {
      return isMobile
        ? `${(percent * 100).toFixed(0)}%`
        : `${name}: ${(percent * 100).toFixed(0)}%`
    },
    [isMobile]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-8 px-2 sm:px-4">
      <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-4">
        Income Analytics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Breakdown Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
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
                    cy={isMobile ? "45%" : "50%"}
                    labelLine={false}
                    outerRadius={isMobile ? 70 : 80}
                    innerRadius={isMobile ? 50 : 50}
                    paddingAngle={2}
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
                  <Legend
                    layout={isMobile ? "horizontal" : "vertical"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    align="right"
                    wrapperStyle={{
                      paddingTop: isMobile ? "10px" : "0",
                      paddingLeft: isMobile ? "0" : "10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Monthly Trend ({currentYear})
          </h3>
          <div className="h-64">
            {monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: isMobile ? 10 : 20,
                    left: isMobile ? -20 : 0,
                    bottom: isMobile ? 30 : 60,
                  }}>
                  <XAxis
                    dataKey="name"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 50 : 60}
                  />
                  <YAxis
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderColor: "#eee",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Bar
                    dataKey="income"
                    fill="#4f46e5"
                    name="Income"
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
