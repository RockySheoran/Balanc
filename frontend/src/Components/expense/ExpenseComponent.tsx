/** @format */
"use client"

import { memo, useCallback, lazy, Suspense } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/Redux/store/hooks"
import { clearExpense } from "@/lib/Redux/features/expense/expenseSlice"
import { motion } from "framer-motion"
import { Button } from "@/Components/ui/button"
import LoadingSpinner from "./LoadingSpinner"


// Dynamically import components with lazy loading
const AddExpenseButton = lazy(() => import("./AddExpenseButton"))
const SummaryCards = lazy(() => import("./SummaryCards"))
const ExpenseAnalysis = lazy(() => import("./ExpenseAnalysis"))
const ExpenseFilters = lazy(() => import("./ExpenseFilters"))
const ExpenseTable = lazy(() => import("./ExpenseTable"))

const ExpenseComponent = memo(() => {
  const { filteredExpenses, totalExpense } = useAppSelector(
    (state) => state.expenses
  )
  const dispatch = useAppDispatch()

  const handleClearExpenses = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all expenses?")) {
      dispatch(clearExpense())
    }
  }, [dispatch])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Expense Tracker
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Suspense fallback={<Button disabled>Loading...</Button>}>
            <AddExpenseButton />
          </Suspense>
          <Button
            variant="destructive"
            onClick={handleClearExpenses}
            aria-label="Clear all expenses"
            className="w-full sm:w-auto">
            Clear All Expenses
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner className="h-32" />}>
        <SummaryCards
          totalExpense={totalExpense}
          expenseCount={filteredExpenses.length}
        />
      </Suspense>

      <Suspense fallback={<LoadingSpinner className="h-96" />}>
        <ExpenseAnalysis expenses={filteredExpenses} />
      </Suspense>

      {/* <Suspense fallback={<LoadingSpinner className="h-32" />}> */}
        <ExpenseFilters />
      {/* </Suspense> */}

      <Suspense fallback={<LoadingSpinner className="h-96" />}>
        <ExpenseTable expenses={filteredExpenses} />
      </Suspense>
    </motion.div>
  )
})

ExpenseComponent.displayName = "ExpenseComponent"
export default ExpenseComponent
