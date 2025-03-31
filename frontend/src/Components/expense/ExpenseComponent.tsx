/** @format */
"use client"

import { useSelector } from "react-redux"


import { useAppSelector } from "@/lib/Redux/store/hooks"
import { selectFilteredExpenses } from "@/lib/Redux/features/expense/selectors"
import AddExpenseButton from "./AddExpenseButton"
import SummaryCards from "./SummaryCards"
import ExpenseAnalysis from "./ExpenseAnalysis"
import ExpenseFilters from "./ExpenseFilters"
import ExpenseTable from "./ExpenseTable"

export default function ExpenseComponent() {
  const { filteredExpenses, totalExpense } = useAppSelector(selectFilteredExpenses)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Expense Tracker</h1>
        <AddExpenseButton />
      </div>

      <SummaryCards
        totalExpense={totalExpense}
        expenseCount={filteredExpenses.length}
      />

      <ExpenseAnalysis />

      <ExpenseFilters />

      <ExpenseTable />
    </div>
  )
}
