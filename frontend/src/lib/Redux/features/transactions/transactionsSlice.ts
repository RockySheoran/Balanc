/** @format */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type TransactionType =
  | "DEBIT"
  | "INVESTMENT"
  | "TRANSFER"
  | "CREDIT"
  | "CASH"
  | "INCOME"
  | "EXPENSES"

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  date: string
  description?: string
}

interface TransactionState {
  transactions: Transaction[]
  income: Transaction[]
  expense: Transaction[]
  investment: Transaction[]
  totals: {
    income: number
    expense: number
    investment: number
  }
  counts: {
    income: number
    expense: number
    investment: number
  }
  averages: {
    income: number
    expense: number
    investment: number
  }
  filtered?: {
    transactions: Transaction[]
    totals: {
      income: number
      expense: number
      investment: number
    }
    counts: {
      income: number
      expense: number
      investment: number
    }
  }
}

const initialState: TransactionState = {
  transactions: [],
  income: [],
  expense: [],
  investment: [],
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
}

// Helper function to calculate transaction statistics
const calculateStats = (transactions: Transaction[]) => {
  const income = transactions.filter(
    (t) => t.type === "INCOME" || t.type === "CREDIT"
  )
  const expense = transactions.filter(
    (t) =>
      t.type === "EXPENSES" ||
      t.type === "DEBIT" ||
      t.type === "TRANSFER" ||
      t.type === "CREDIT" ||
      t.type === "CASH"
  )
  const investment = transactions.filter((t) => t.type === "INVESTMENT")

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0)
  const totalInvestment = investment.reduce((sum, t) => sum + t.amount, 0)

  return {
    transactions,
    income,
    expense,
    investment,
    totals: {
      income: totalIncome,
      expense: totalExpense,
      investment: totalInvestment,
    },
    counts: {
      income: income.length,
      expense: expense.length,
      investment: investment.length,
    },
    averages: {
      income: income.length ? totalIncome / income.length : 0,
      expense: expense.length ? totalExpense / expense.length : 0,
      investment: investment.length ? totalInvestment / investment.length : 0,
    },
  }
}

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const updatedTransactions = [...state.transactions, action.payload]
      return {
        ...calculateStats(updatedTransactions),
        filtered: state.filtered,
      }
    },

    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const updatedTransactions = state.transactions.map((t) =>
        t.id === action.payload.id ? action.payload : t
      )
      return {
        ...calculateStats(updatedTransactions),
        filtered: state.filtered,
      }
    },

    deleteTransaction: (state, action: PayloadAction<string>) => {
      const updatedTransactions = state.transactions.filter(
        (t) => t.id !== action.payload
      )
      return {
        ...calculateStats(updatedTransactions),
        filtered: state.filtered,
      }
    },

    clearTransactions: () => initialState,

    filterByCategory: (state, action: PayloadAction<string>) => {
      const filteredTransactions = state.transactions.filter(
        (t) => t.category === action.payload
      )

      const filteredIncome = filteredTransactions.filter(
        (t) => t.type === "INCOME" || t.type === "CREDIT"
      )
      const filteredExpense = filteredTransactions.filter(
        (t) =>
          t.type === "EXPENSES" ||
          t.type === "DEBIT" ||
          t.type === "TRANSFER" ||
          t.type === "CREDIT" ||
          t.type === "CASH"
      )
      const filteredInvestment = filteredTransactions.filter(
        (t) => t.type === "INVESTMENT"
      )

      return {
        ...state,
        filtered: {
          transactions: filteredTransactions,
          totals: {
            income: filteredIncome.reduce((sum, t) => sum + t.amount, 0),
            expense: filteredExpense.reduce((sum, t) => sum + t.amount, 0),
            investment: filteredInvestment.reduce(
              (sum, t) => sum + t.amount,
              0
            ),
          },
          counts: {
            income: filteredIncome.length,
            expense: filteredExpense.length,
            investment: filteredInvestment.length,
          },
        },
      }
    },

    clearFilters: (state) => {
      return {
        ...state,
        filtered: undefined,
      }
    },

    // Additional useful actions
    importTransactions: (state, action: PayloadAction<Transaction[]>) => {
      const updatedTransactions = [...state.transactions, ...action.payload]
      return calculateStats(updatedTransactions)
    },

    setTransactions: (_, action: PayloadAction<Transaction[]>) => {
      return calculateStats(action.payload)
    },
  },
})

export const {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  clearTransactions,
  filterByCategory,
  clearFilters,
  importTransactions,
  setTransactions,
} = transactionSlice.actions

export default transactionSlice.reducer
