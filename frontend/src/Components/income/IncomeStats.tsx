/** @format */
"use client"
import { useSelector } from "react-redux"

import { motion } from "framer-motion"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { selectAverageIncome, selectLastMonthIncome, selectTotalIncome } from "@/lib/Redux/features/income/incomeSlices"

const IncomeStats = () => {
  const totalIncome = useAppSelector(selectTotalIncome)
  const lastMonthIncome = useAppSelector(selectLastMonthIncome)
  const averageIncome = useAppSelector(selectAverageIncome)
 

  const stats = [
    {
      name: "Total Income",
      value: totalIncome.toFixed(2),
      change: "+12%",
      trend: "up",
    },
    {
      name: "Last Month",
      value: lastMonthIncome.toFixed(2),
      change: "+5%",
      trend: "up",
    },
    {
      name: "Avg. Income",
      value: averageIncome.toFixed(2),
      change: "-2%",
      trend: "down",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8">
      <h2 className="text-xl font-semibold text-indigo-800 mb-4">
        Income Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-gradient-to-r ${
              index === 0
                ? "from-blue-500 to-indigo-600"
                : index === 1
                ? "from-purple-500 to-pink-500"
                : "from-green-500 to-teal-500"
            } rounded-xl p-4 text-white shadow-lg`}>
            <div className="text-sm font-medium">{stat.name}</div>
            <div className="text-2xl font-bold my-2">${stat.value}</div>
            <div
              className={`flex items-center text-xs ${
                stat.trend === "up" ? "text-green-200" : "text-red-200"
              }`}>
              {stat.change}
              {stat.trend === "up" ? (
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default IncomeStats
