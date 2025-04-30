/** @format */
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Expense, FilterState, } from "./types"

interface ExpenseState {
  expenses: Expense[]
  filterState: FilterState
  filteredExpenses: Expense[]
  totalExpense: number
  needsRecalculation: boolean
}

const initialState: ExpenseState = {
  expenses: [],
  filteredExpenses: [],
  totalExpense: 0,
  needsRecalculation: true,
  filterState: {
    searchTerm: "",
    dateRange: { from: undefined, to: undefined },
    categoryFilter: "all",
    sortBy: "date",
    sortOrder: "desc",
    activeChart: "bar",
    activeIndex: null,
    currentPage: 1,
    itemsPerPage: 8,
  },
}

const recalculateExpenses = (state: ExpenseState) => {
  let result = [...state.expenses]

  // Apply search filter
  if (state.filterState.searchTerm) {
    result = result.filter(
      (expense) =>
        expense.name
          .toLowerCase()
          .includes(state.filterState.searchTerm.toLowerCase()) ||
        expense.category
          .toLowerCase()
          .includes(state.filterState.searchTerm.toLowerCase()) ||
        expense.description
          ?.toLowerCase()
          .includes(state.filterState.searchTerm.toLowerCase())
    )
  }

  // Apply date range filter
  if (state.filterState.dateRange?.from) {
    result = result.filter(
      (expense) =>
        new Date(expense.date) >= new Date(state.filterState.dateRange.from!)
    )
  }
  if (state.filterState.dateRange?.to) {
    result = result.filter(
      (expense) =>
        new Date(expense.date) <= new Date(state.filterState.dateRange.to!)
    )
  }

  // Apply category filter
  if (state.filterState.categoryFilter !== "all") {
    result = result.filter(
      (expense) => expense.category === state.filterState.categoryFilter
    )
  }

  // Apply sorting
  result.sort((a, b) => {
    if (state.filterState.sortBy === "date") {
      return state.filterState.sortOrder === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (state.filterState.sortBy === "amount") {
      return state.filterState.sortOrder === "asc"
        ? a.amount - b.amount
        : b.amount - a.amount
    } else {
      return state.filterState.sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    }
  })

  state.filteredExpenses = result
  state.totalExpense = result.reduce((sum, expense) => sum + expense.amount, 0)
  state.needsRecalculation = false
}

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, "id">>) => {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...action.payload,
        date: action.payload.date || new Date().toISOString(),
      }
      state.expenses.unshift(newExpense)
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    //
    clearExpense: () => {
    
      return { ...initialState }
    },

    updateExpense: (state, action: PayloadAction<Expense>) => {
      console.log("Updating expense:", action.payload)
      const index = state.expenses.findIndex((e) => e.id === action.payload.id)
     
        state.expenses[index] = action.payload
        state.needsRecalculation = true
        recalculateExpenses(state)
      console.log("Updated expenses:", state.expenses)
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload)
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filterState.searchTerm = action.payload
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setDateRange: (state, action: PayloadAction<FilterState["dateRange"]>) => {
      state.filterState.dateRange = action.payload
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filterState.categoryFilter = action.payload
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setSortBy: (state, action: PayloadAction<"date" | "amount" | "name">) => {
      state.filterState.sortBy = action.payload
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setSortOrder: (state, action: PayloadAction<"asc" | "desc">) => {
      state.filterState.sortOrder = action.payload
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    setActiveChart: (state, action: PayloadAction<"bar" | "pie">) => {
      state.filterState.activeChart = action.payload
    },
    setActiveIndex: (state, action: PayloadAction<number | null>) => {
      state.filterState.activeIndex = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filterState.currentPage = action.payload
    },
    resetFilters: (state) => {
      state.filterState = {
        ...initialState.filterState,
        itemsPerPage: state.filterState.itemsPerPage,
      }
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
    recalculate: (state) => {
      state.needsRecalculation = true
      recalculateExpenses(state)
    },
  },
})

export const {
  addExpense,
  clearExpense,
  updateExpense,
  deleteExpense,
  setSearchTerm,
  setDateRange,
  setCategoryFilter,
  setSortBy,
  setSortOrder,
  setActiveChart,
  setActiveIndex,
  setCurrentPage,
  resetFilters,
  recalculate,
} = expenseSlice.actions

export default expenseSlice.reducer
