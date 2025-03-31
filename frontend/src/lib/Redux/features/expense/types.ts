/** @format */

import { DateRange } from "react-day-picker"

export interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string // Stored as ISO string
  description?: string
}

export interface FilterState {
  searchTerm: string
  dateRange: DateRange
  categoryFilter: string
  sortBy: "date" | "amount" | "name"
  sortOrder: "asc" | "desc"
  activeChart: "bar" | "pie"
  activeIndex: number | null
  currentPage: number
  itemsPerPage: number
}

export interface ExpenseState {
  expenses: Expense[]
  filteredExpenses: Expense[]
  totalExpense: number
  filterState: FilterState
}
