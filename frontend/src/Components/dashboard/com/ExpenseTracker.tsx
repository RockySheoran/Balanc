/** @format */

"use client"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import { motion } from "framer-motion"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { useMemo, useCallback, useEffect } from "react"
import { FiDollarSign } from "react-icons/fi"
import { toast } from "sonner"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  date: string
}

interface ExpenseData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderRadius: number
    borderSkipped: boolean
  }[]
}

const CATEGORY_COLORS = [
  "#FF6384", // Red
  "#36A2EB", // Blue
  "#FFCE56", // Yellow
  "#4BC0C0", // Teal
  "#9966FF", // Purple
  "#FF9F40", // Orange
  "#8AC24A", // Green
]

const DAYS_TO_FILTER = 30
const MAX_RECENT_EXPENSES = 5

export const ExpenseTracker = () => {
  const { transactions } = useAppSelector((state) => state.transactions)
useEffect(() => {
  if(!transactions) {
   toast.error("No transactions found1111111111111111111111111111")
  }else{
    toast.success("Transactions found2222222222222222222222222222222222")
  }

},[transactions])
  const { expenseData, recentExpenses } = useMemo(() => {
    const thirtyDaysAgo = new Date(
      Date.now() - DAYS_TO_FILTER * 24 * 60 * 60 * 1000
    )

    const expenseTransactions = transactions
      .filter(
        (t) =>
          (t.type === "DEBIT" || t.type === "EXPENSE") &&
          new Date(t.date) > thirtyDaysAgo
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const categoryMap = expenseTransactions.reduce((acc, transaction) => {
      acc[transaction.category] =
        (acc[transaction.category] || 0) + transaction.amount
      return acc
    }, {} as Record<string, number>)

    const categories = Object.keys(categoryMap)
    const amounts = Object.values(categoryMap)

    return {
      expenseData: {
        labels: categories,
        datasets: [
          {
            label: "Expense Amount",
            data: amounts,
            backgroundColor: categories.map(
              (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]
            ),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      recentExpenses: expenseTransactions.slice(0, MAX_RECENT_EXPENSES),
    }
  }, [transactions])

  const totalExpenses = useMemo(() => {
    return recentExpenses.reduce((sum, t) => sum + t.amount, 0)
  }, [recentExpenses])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  const formatTransactionDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className=" max-w-7xl mt-3 mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Recent Expenses */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Recent Expenses
            </h1>
            <div className="flex items-center bg-red-50 px-3 py-1 rounded-full">
              <FiDollarSign className="text-red-500 mr-1" />
              <span className="font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.slice(0, 4).map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatTransactionDate(transaction.date)}
                    </p>
                  </div>
                  <p className="text-red-500 font-bold">
                    -{formatCurrency(transaction.amount)}
                  </p>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500">
                No expenses recorded in the last 30 days
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column - Expense Chart */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Expense Breakdown
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-64">
            <Bar
              data={expenseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      borderWidth: 0,
                    },
                    ticks: {
                      callback: (value) => formatCurrency(Number(value)),
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `Amount: ${formatCurrency(context.raw as number)}`,
                      title: (context) => context[0].label,
                    },
                  },
                },
                animation: {
                  duration: 1000,
                },
              }}
            />
          </motion.div>

          {/* Color Legend */}
          {expenseData.labels.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {expenseData.labels.map((label, index) => (
                <div key={label} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor:
                        expenseData.datasets[0].backgroundColor[index],
                    }}
                  />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
