/** @format */
import React, { useMemo } from "react"

interface SummaryCardsProps {
  totalExpense: number
  expenseCount: number
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalExpense,
  expenseCount,
}) => {
  // Memoize the average calculation to prevent recalculation on every render
  const averageExpense = useMemo(() => {
    return expenseCount > 0 ? totalExpense / expenseCount : 0
  }, [totalExpense, expenseCount])

  // Format the total expense once
  const formattedTotal = useMemo(() => totalExpense.toFixed(2), [totalExpense])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Expenses Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all hover:shadow-md">
        <h3 className="text-gray-500 dark:text-gray-400 font-medium">
          Total Expenses
        </h3>
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          ${formattedTotal}
        </p>
      </div>

      {/* Expense Count Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all hover:shadow-md">
        <h3 className="text-gray-500 dark:text-gray-400 font-medium">
          Number of Expenses
        </h3>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {expenseCount}
        </p>
      </div>

      {/* Average Expense Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all hover:shadow-md">
        <h3 className="text-gray-500 dark:text-gray-400 font-medium">
          Average Expense
        </h3>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          ${averageExpense.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(SummaryCards)
