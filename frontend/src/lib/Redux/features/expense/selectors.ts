/** @format */

import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"


export const selectFilteredExpenses = createSelector(
  [
    (state: RootState) => state.expenses.expenses,
    (state: RootState) => state.expenses.filterState.searchTerm,
    (state: RootState) => state.expenses.filterState.dateRange,
    (state: RootState) => state.expenses.filterState.categoryFilter,
    (state: RootState) => state.expenses.filterState.sortBy,
    (state: RootState) => state.expenses.filterState.sortOrder,
  ],
  (expenses, searchTerm, dateRange, categoryFilter, sortBy, sortOrder) => {
    let result = [...expenses]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (expense) =>
          expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply date range filter
    if (dateRange?.from) {
      result = result.filter(
        (expense) => new Date(expense.date) >= new Date(dateRange.from!)
      )
    }
    if (dateRange?.to) {
      result = result.filter(
        (expense) => new Date(expense.date) <= new Date(dateRange.to!)
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((expense) => expense.category === categoryFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
      } else {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
    })

    return {
      filteredExpenses: result,
      totalExpense: result.reduce((sum, expense) => sum + expense.amount, 0),
    }
  }
)
