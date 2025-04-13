/** @format */
"use client"

import { motion } from "framer-motion"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import {
  selectAverageIncome,
  selectLastMonthIncome,
  selectTotalIncome,
} from "@/lib/Redux/features/income/incomeSlices"
import { memo, useMemo } from "react"
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi"

const IncomeStats = memo(() => {
  const totalIncome = useAppSelector(selectTotalIncome)
  const lastMonthIncome = useAppSelector(selectLastMonthIncome)
  const averageIncome = useAppSelector(selectAverageIncome)

  const stats = useMemo(
    () => [
      {
        name: "Total Income",
        value: totalIncome.toFixed(2),
       
       
        gradient: "from-blue-500 to-indigo-600",
        icon: <FiTrendingUp className="w-4 h-4 ml-1" />,
      },
      {
        name: "Last Month",
        value: lastMonthIncome.toFixed(2),
        
      
        gradient: "from-purple-500 to-pink-500",
        icon: <FiTrendingUp className="w-4 h-4 ml-1" />,
      },
      {
        name: "Avg. Income",
        value: averageIncome.toFixed(2),
       
      
        gradient: "from-green-500 to-teal-500",
        icon: <FiTrendingDown className="w-4 h-4 ml-1" />,
      },
    ],
    [totalIncome, lastMonthIncome, averageIncome]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8">
      <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-4">
        Income Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={`${stat.name}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}
            whileHover={{ scale: 1.02 }}>
            <div className="text-sm font-medium">{stat.name}</div>
            <div className="text-2xl font-bold my-2">${stat.value}</div>
            <div
              className={`flex items-center text-xs ${
                stat.trend === "up" ? "text-green-200" : "text-red-200"
              }`}>
              {stat.change}
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
})

IncomeStats.displayName = "IncomeStats"
export default IncomeStats
