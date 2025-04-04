/** @format */
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { subDays, subMonths, subYears, startOfWeek } from "date-fns"

// Enhanced types
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
  date: string
  description: string
  amount: number
  type: TransactionType
  category: string
}

type SortDirection = "asc" | "desc"

interface SortConfig {
  key: keyof Transaction
  direction: SortDirection
}

interface FiltersState {
  timeFilter: string
  typeFilter: string
  categoryFilter: string
  sortConfig: SortConfig
}

interface TransactionMetrics {
  income: number
  expense: number
  investment: number
}

interface TransactionState {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  incomeTransactions: Transaction[]
  expenseTransactions: Transaction[]
  investmentTransactions: Transaction[]
  totals: TransactionMetrics
  counts: TransactionMetrics
  averages: TransactionMetrics
  filters: FiltersState
  pagination: {
    currentPage: number
    transactionsPerPage: number
  }
}

const initialFilters: FiltersState = {
  timeFilter: "month",
  typeFilter: "all",
  categoryFilter: "all",
  sortConfig: {
    key: "date",
    direction: "desc",
  },
}

const initialState: TransactionState = {
  transactions: [],
  filteredTransactions: [],
  incomeTransactions: [],
  expenseTransactions: [],
  investmentTransactions: [],
  totals: {
    income: 0,
    expense: 0,
    investment: 0,
  },
  counts: {
    income: 0,
    expense: 0,
    investment: 0,
  },
  averages: {
    income: 0,
    expense: 0,
    investment: 0,
  },
  filters: initialFilters,
  pagination: {
    currentPage: 1,
    transactionsPerPage: 5,
  },
}

// Helper function to safely get sortConfig
const getSafeSortConfig = (state: TransactionState): SortConfig => {
  return state.filters?.sortConfig ?? initialFilters.sortConfig
}

// State validation function
function isValidTransactionState(state: any): state is TransactionState {
  return (
    state &&
    Array.isArray(state.transactions) &&
    state.filters?.sortConfig?.key !== undefined &&
    state.filters?.sortConfig?.direction !== undefined
  )
}

// Helper functions
const filterByTimePeriod = (
  transactions: Transaction[],
  period: string
): Transaction[] => {
  const now = new Date()
  const transactionDate = (date: string) => new Date(date)

  switch (period) {
    case "day":
      return transactions.filter(
        (t) => transactionDate(t.date) >= subDays(now, 1)
      )
    case "week":
      return transactions.filter(
        (t) => transactionDate(t.date) >= startOfWeek(now)
      )
    case "month":
      return transactions.filter(
        (t) => transactionDate(t.date) >= subMonths(now, 1)
      )
    case "year":
      return transactions.filter(
        (t) => transactionDate(t.date) >= subYears(now, 1)
      )
    default:
      return [...transactions]
  }
}

const sortTransactions = (
  transactions: Transaction[],
  sortConfig: SortConfig
): Transaction[] => {
  return [...transactions].sort((a, b) => {
    if (sortConfig.key === "date") {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
    }

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })
}

const calculateMetrics = (transactions: Transaction[]) => {
  const incomeTransactions = transactions.filter(
    (t) => t.type === "INCOME" || t.type === "CREDIT"
  )
  const expenseTransactions = transactions.filter(
    (t) =>
      t.type === "EXPENSE" ||
      t.type === "DEBIT" ||
      t.type === "TRANSFER" ||
      t.type === "CASH"
  )
  const investmentTransactions = transactions.filter(
    (t) => t.type === "INVESTMENT"
  )

  const calculate = (items: Transaction[]) => ({
    count: items.length,
    total: items.reduce((sum, t) => sum + t.amount, 0),
    average: items.length
      ? items.reduce((sum, t) => sum + t.amount, 0) / items.length
      : 0,
  })

  return {
    incomeTransactions,
    expenseTransactions,
    investmentTransactions,
    counts: {
      income: incomeTransactions.length,
      expense: expenseTransactions.length,
      investment: investmentTransactions.length,
    },
    totals: {
      income: calculate(incomeTransactions).total,
      expense: calculate(expenseTransactions).total,
      investment: calculate(investmentTransactions).total,
    },
    averages: {
      income: calculate(incomeTransactions).average,
      expense: calculate(expenseTransactions).average,
      investment: calculate(investmentTransactions).average,
    },
  }
}

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const safeSortConfig = getSafeSortConfig(state)
      const newTransactions = [action.payload, ...state.transactions]
      const metrics = calculateMetrics(newTransactions)

      return {
        ...state,
        transactions: newTransactions,
        filteredTransactions: sortTransactions(
          [...state.filteredTransactions, action.payload],
          safeSortConfig
        ),
        ...metrics,
      }
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const newTransactions = state.transactions.map((t) =>
        t.id === action.payload.id ? action.payload : t
      )
      const metrics = calculateMetrics(newTransactions)

      return {
        ...state,
        transactions: newTransactions,
        ...metrics,
      }
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      const newTransactions = state.transactions.filter(
        (t) => t.id !== action.payload
      )
      const metrics = calculateMetrics(newTransactions)

      return {
        ...state,
        transactions: newTransactions,
        ...metrics,
      }
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      const safeSortConfig = getSafeSortConfig(state)

      return {
        ...state,
        transactions: action.payload,
        filteredTransactions: sortTransactions(action.payload, safeSortConfig),
        ...calculateMetrics(action.payload),
      }
    },
    setTimeFilter: (state, action: PayloadAction<string>) => {
      const safeSortConfig = getSafeSortConfig(state)
      const timeFilter = action.payload
      const filtered = filterByTimePeriod(state.transactions, timeFilter)
      const sorted = sortTransactions(filtered, safeSortConfig)
      const metrics = calculateMetrics(sorted)

      return {
        ...state,
        filters: {
          ...state.filters,
          timeFilter,
        },
        filteredTransactions: sorted,
        ...metrics,
      }
    },
    setTypeFilter: (state, action: PayloadAction<string>) => {
      const safeSortConfig = getSafeSortConfig(state)
      const typeFilter = action.payload
      const filtered = state.transactions.filter(
        (t) => typeFilter === "all" || t.type === typeFilter
      )
      const sorted = sortTransactions(filtered, safeSortConfig)
      const metrics = calculateMetrics(sorted)

      return {
        ...state,
        filters: {
          ...state.filters,
          typeFilter,
        },
        filteredTransactions: sorted,
        ...metrics,
      }
    },
    setSortConfig: (
      state,
      action: PayloadAction<{
        key: keyof Transaction
        direction?: SortDirection
      }>
    ) => {
      const { key, direction } = action.payload
      const newDirection =
        direction ??
        (state.filters.sortConfig.key === key &&
        state.filters.sortConfig.direction === "asc"
          ? "desc"
          : "asc")

      const sorted = sortTransactions(state.filteredTransactions, {
        key,
        direction: newDirection,
      })

      return {
        ...state,
        filters: {
          ...state.filters,
          sortConfig: { key, direction: newDirection },
        },
        filteredTransactions: sorted,
      }
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          currentPage: action.payload,
        },
      }
    },
    clearFilters: (state) => {
      const sorted = sortTransactions(
        [...state.transactions],
        initialFilters.sortConfig
      )
      const metrics = calculateMetrics(sorted)

      return {
        ...state,
        filters: initialFilters,
        filteredTransactions: sorted,
        ...metrics,
      }
    },
    clearTransactions: () => initialState,

    resetState: () => {
      console.warn("Resetting transactions state to initial state")
      return initialState
    },
  },
})

export const {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setTransactions,
  setTimeFilter,
  setTypeFilter,
  setSortConfig,
  setCurrentPage,
  clearFilters,
  clearTransactions,
  resetState,
} = transactionSlice.actions

// Export the validation function for use in middleware
export { isValidTransactionState }

export default transactionSlice.reducer
