/** @format */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios from "axios"

interface Investment {
  id: string
  userId: string
  accountId: string
  name: string
  symbol: string
  type: "STOCK" | "CRYPTO" | "MUTUAL_FUND" | "EXPENSE"
  amount: number
  quantity: number
  buyDate: string // ISO format
  sellDate: string | null
  buyPrice: number
  sellPrice: number | null
  currentValue: number
  createdAt: string
  updatedAt: string
}

interface Filters {
  dateRange: "1m" | "3m" | "6m" | "1y" | "all"
  performanceFilter: "all" | "profit" | "loss" | "best"
  searchTerm: string
}

interface InvestmentState {
  investments: Investment[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  selectedInvestment: Investment | null
  filters: Filters
}

const initialState: InvestmentState = {
  investments: [],
  status: "idle",
  error: null,
  selectedInvestment: null,
  filters: {
    dateRange: "all",
    performanceFilter: "all",
    searchTerm: "",
  },
}

// Helper function to fetch current price
const fetchCurrentPrice = async (symbol: string) => {
  const options = {
    method: "GET",
    url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
    params: { region: symbol.endsWith(".NS") ? "IN" : "US", symbol },
    headers: {
      "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI1 || "",
      "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
    },
  }
  const response = await axios.request(options)
  return response.data.quoteSummary.result[0].price.regularMarketPrice.raw
}

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchStockPrice",
  async (symbol: string, { rejectWithValue }) => {
    try {
      const price = await fetchCurrentPrice(symbol)
      return { symbol, price }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message)
      }
      return rejectWithValue("An unknown error occurred")
    }
  }
)

export const addInvestment = createAsyncThunk(
  "investments/addInvestment",
  async (
    investmentData: Omit<
      Investment,
      "id" | "createdAt" | "updatedAt" | "currentValue"
    >,
    { rejectWithValue }
  ) => {
    try {
      // Fetch current price when adding new investment
      const currentPrice = await fetchCurrentPrice(investmentData.symbol)

      const newInvestment = {
        ...investmentData,
        currentValue: currentPrice * investmentData.quantity,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return newInvestment
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message)
      }
      return rejectWithValue("Failed to add investment")
    }
  }
)

const investmentSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    // Filter actions
    setFilter: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    // Selection action
    selectInvestment: (state, action: PayloadAction<string>) => {
      state.selectedInvestment =
        state.investments.find((inv) => inv.id === action.payload) || null
    },

    // Add investment from backend sync
    addBackendInvestment: (state, action: PayloadAction<Investment>) => {
      const existingIndex = state.investments.findIndex(
        (inv) => inv.id === action.payload.id
      )
      if (existingIndex >= 0) {
        state.investments[existingIndex] = action.payload
       
      } else {
        state.investments?.push(action.payload)
      }
    },

    // Update current value for all investments
    updateAllCurrentValues: (state) => {
      state.status = "loading"
      state.investments?.forEach(async (investment) => {
        try {
          const currentPrice = await fetchCurrentPrice(investment.symbol)
          investment.currentValue = currentPrice
        
        } catch (error) {
          console.error(`Failed to update price for ${investment.symbol}`)
        }
      })
      state.status = "succeeded"
    },

    // Delete investment
    deleteInvestment: (state, action: PayloadAction<string>) => {
      state.investments = state.investments.filter(
        (inv) => inv.id !== action.payload
      )
      if (state.selectedInvestment?.id === action.payload) {
        state.selectedInvestment = null
      }
    },

    // Clear all investments
    clearInvestments: (state) => {
      state.investments = []
      state.selectedInvestment = null
      state.status = "idle"
      state.error = null
      state.filters = initialState.filters
    },

    // Reset filters only
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
  },
  extraReducers: (builder) => {
    builder
      // Price fetching
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.investments = state.investments.map((inv) =>
          inv.symbol === action.payload.symbol
            ? {
                ...inv,
                currentValue: action.payload.price * inv.quantity,
                updatedAt: new Date().toISOString(),
              }
            : inv
        )
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to fetch price"
      })

      // Adding investments
      .addCase(addInvestment.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(addInvestment.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.investments.push(action.payload)
      })
      .addCase(addInvestment.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Failed to add investment"
      })
  },
})

export const {
  setFilter,
  selectInvestment,
  addBackendInvestment,
  updateAllCurrentValues,
  deleteInvestment,
  clearInvestments,
  resetFilters,
} = investmentSlice.actions

export default investmentSlice.reducer
