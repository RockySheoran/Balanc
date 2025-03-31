/** @format */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Expense, FilterState } from "./types"

interface ExpenseState {
  expenses: Expense[]
  filterState: FilterState
  filteredExpenses: Expense[] // Add this
  totalExpense: number // Add this
}

const initialState: ExpenseState = {
  expenses: [
    {
      id: "1",
      name: "Groceries",
      amount: 150.75,
      category: "Food",
      date: new Date("2023-05-15").toISOString(),
    },
    {
      id: "2",
      name: "Electricity Bill",
      amount: 85.2,
      category: "Utilities",
      date: new Date("2023-05-10").toISOString(),
    },
    {
      id: "3",
      name: "Internet",
      amount: 59.99,
      category: "Utilities",
      date: new Date("2023-05-05").toISOString(),
    },
    {
      id: "4",
      name: "Dinner Out",
      amount: 65.5,
      category: "Food",
      date: new Date("2023-04-28").toISOString(),
    },
    {
      id: "5",
      name: "Gas",
      amount: 45.3,
      category: "Transportation",
      date: new Date("2023-04-25").toISOString(),
    },
    {
      id: "6",
      name: "Movie Tickets",
      amount: 32.0,
      category: "Entertainment",
      date: new Date("2023-04-20").toISOString(),
    },
    {
      id: "7",
      name: "Gym Membership",
      amount: 35.0,
      category: "Health",
      date: new Date("2023-04-15").toISOString(),
    },
    {
      id: "8",
      name: "Books",
      amount: 42.5,
      category: "Education",
      date: new Date("2023-04-10").toISOString(),
    },
    {
      id: "9",
      name: "Phone Bill",
      amount: 55.0,
      category: "Utilities",
      date: new Date("2023-04-05").toISOString(),
    },
    {
      id: "10",
      name: "Coffee",
      amount: 12.75,
      category: "Food",
      date: new Date("2023-03-30").toISOString(),
    },
  ],
  filteredExpenses: [], // Add this - initialize as empty array
  totalExpense: 0, // Add this
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

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  // Add this inside the createSlice configuration
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        [
          setSearchTerm.type,
          setDateRange.type,
          setCategoryFilter.type,
          setSortBy.type,
          setSortOrder.type,
          addExpense.type,
          updateExpense.type,
          deleteExpense.type,
          resetFilters.type,
        ].includes(action.type),
      (state) => {
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
              new Date(expense.date) >=
              new Date(state.filterState.dateRange.from!)
          )
        }
        if (state.filterState.dateRange?.to) {
          result = result.filter(
            (expense) =>
              new Date(expense.date) <=
              new Date(state.filterState.dateRange.to!)
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
        state.totalExpense = result.reduce(
          (sum, expense) => sum + expense.amount,
          0
        )
      }
    )
  },
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, "id">>) => {
      const newExpense = {
        ...action.payload,
        id: Date.now().toString(),
        date: action.payload.date || new Date().toISOString(),
      }
      state.expenses.unshift(newExpense)
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) {
        state.expenses[index] = action.payload
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload)
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filterState.searchTerm = action.payload
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.filterState.dateRange = action.payload
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filterState.categoryFilter = action.payload
    },
    setSortBy: (state, action: PayloadAction<"date" | "amount" | "name">) => {
      state.filterState.sortBy = action.payload
    },
    setSortOrder: (state, action: PayloadAction<"asc" | "desc">) => {
      state.filterState.sortOrder = action.payload
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
    },
  },
})

export const {
  addExpense,
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
} = expenseSlice.actions

export default expenseSlice.reducer
