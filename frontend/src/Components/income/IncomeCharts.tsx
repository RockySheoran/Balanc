/** @format */

"use client"

import { motion } from "framer-motion"
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const IncomeCharts = () => {
  // Get real data from Redux store
  const categories = useAppSelector(selectCategories)
  const totalIncome = useAppSelector(selectTotalIncome)
  const categoryData = useAppSelector(selectCategoryData) as Array<{ name: string; value: number }>
  const monthlyData = useAppSelector(selectMonthlyIncomeData)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mb-8">
      <h2 className="text-xl font-semibold text-indigo-800 mb-4">
        Income Analytics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            By Category ({new Date().getFullYear()})
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      "Amount",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Monthly Trend ({new Date().getFullYear()})
          </h3>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      "Amount",
                    ]}
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
              <div className="h-full flex items-center justify-center text-gray-500">
                No monthly data available
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default IncomeCharts
