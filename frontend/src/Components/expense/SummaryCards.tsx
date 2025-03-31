/** @format */

import React from "react"

interface SummaryCardsProps {
  totalExpense: number
  expenseCount: number
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalExpense,
  expenseCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 font-medium">Total Expenses</h3>
        <p className="text-2xl font-bold text-purple-600">
          ${totalExpense.toFixed(2)}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 font-medium">Number of Expenses</h3>
        <p className="text-2xl font-bold text-blue-600">{expenseCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 font-medium">Average Expense</h3>
        <p className="text-2xl font-bold text-green-600">
          ${(expenseCount > 0 ? totalExpense / expenseCount : 0).toFixed(2)}
        </p>
      </div>
    </div>
  )
}

export default SummaryCards
