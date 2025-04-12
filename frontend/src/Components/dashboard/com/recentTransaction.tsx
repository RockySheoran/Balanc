/** @format */

"use client"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { motion } from "framer-motion"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { useMemo, useCallback } from "react"
import { FiArrowRight, FiTrendingUp, FiTrendingDown } from "react-icons/fi"
import Link from "next/link"

ChartJS.register(ArcElement, Tooltip, Legend)

type TransactionType =
  | "DEBIT"
  | "INVESTMENT"
  | "TRANSFER"
  | "CREDIT"
  | "CASH"
  | "INCOME"
  | "EXPENSE"

interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  date: string
}

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
}

const TYPE_COLORS: Record<string, string> = {
  INCOME: "#10b981",
  CREDIT: "#10b981",
  EXPENSE: "#ef4444",
  DEBIT: "#ef4444",
  INVESTMENT: "#8b5cf6",
  TRANSFER: "#3b82f6",
  CASH: "#f59e0b",
}

const MAX_RECENT_TRANSACTIONS = 5

export const RecentTransaction = () => {
  const { transactions } = useAppSelector((store) => store.transactions)

  const { totalIncome, totalExpenses, balance }: FinancialSummary = useMemo(
    () =>
      transactions.reduce<FinancialSummary>(
        (acc, transaction) => {
          const amount = Math.abs(transaction.amount)
          if (transaction.type === "INCOME" || transaction.type === "CREDIT") {
            acc.totalIncome += amount
          } else {
            acc.totalExpenses += amount
          }
          acc.balance = acc.totalIncome - acc.totalExpenses
          return acc
        },
        { totalIncome: 0, totalExpenses: 0, balance: 0 }
      ),
    [transactions]
  )

  const chartData = useMemo(() => {
    const typeTotals: Record<string, number> = {}

    transactions.forEach((transaction) => {
      const type = transaction.type
      typeTotals[type] = (typeTotals[type] || 0) + Math.abs(transaction.amount)
    })

    const activeTypes = Object.keys(typeTotals)
    const hasTransactions = activeTypes?.length > 0

    return {
      labels: hasTransactions ? activeTypes : ["No transactions"],
      datasets: [
        {
          data: hasTransactions
            ? activeTypes.map((type) => typeTotals[type])
            : [1],
          backgroundColor: hasTransactions
            ? activeTypes.map((type) => TYPE_COLORS[type] || "#94a3b8")
            : ["#e2e8f0"],
          borderWidth: 0,
        },
      ],
    }
  }, [transactions])

  const recentTransactions = useMemo<Transaction[]>(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_RECENT_TRANSACTIONS)
  }, [transactions])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  const isPositiveTransaction = useCallback((type: TransactionType) => {
    return type === "INCOME" || type === "CREDIT"
  }, [])

  const renderTransactionIcon = useCallback(
    (type: TransactionType) => {
      return isPositiveTransaction(type) ? (
        <FiTrendingUp size={18} />
      ) : (
        <FiTrendingDown size={18} />
      )
    },
    [isPositiveTransaction]
  )

  const getTransactionColorClasses = useCallback(
    (type: TransactionType) => {
      return isPositiveTransaction(type)
        ? "bg-green-100 text-green-600"
        : "bg-red-100 text-red-600"
    },
    [isPositiveTransaction]
  )

  const formatTransactionDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl w-full mt-5 mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Recent Transactions */}
        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Recent Transactions
            </h2>
            <Link
              href="/transations"
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              prefetch={false}>
              See All <FiArrowRight className="ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions?.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <motion.div
                  key={`${transaction.id}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg mr-3 ${getTransactionColorClasses(
                        transaction.type
                      )}`}>
                      {renderTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-sm text-gray-500">
                        {formatTransactionDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-medium ${
                      isPositiveTransaction(transaction.type)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    {isPositiveTransaction(transaction.type) ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500">
                No recent transactions
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column - Financial Overview */}
        <div className="md:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Financial Overview
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Balance</span>
                <span
                  className={`text-2xl font-bold ${
                    balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  {formatCurrency(balance)}
                </span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm text-gray-500">Income</p>
                    <p className="font-medium">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm text-gray-500">Expenses</p>
                    <p className="font-medium">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Doughnut Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-4 h-80 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Spending by Category
            </h3>
            <div className="flex h-[80%] justify-center">
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "70%",
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        boxWidth: 10,
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: "circle",
                        font: {
                          family: "'Inter', sans-serif",
                        },
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || ""
                          const value = context.raw as number
                          return `${label}: ${formatCurrency(value)}`
                        },
                      },
                    },
                  },
                  animation: {
                    animateScale: true,
                    animateRotate: true,
                  },
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
