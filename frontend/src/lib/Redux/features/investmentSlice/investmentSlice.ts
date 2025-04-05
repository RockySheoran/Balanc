/** @format */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios from "axios"

interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentPrice?: number
  buyDate: string
  type: "stock" | "crypto" | "mutual-fund"
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

export const fetchStockPrice = createAsyncThunk(
  "investments/fetchStockPrice",
  async (symbol: string) => {
    const options = {
      method: "GET",
      url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
      params: { region: "US", symbol },
      headers: {
        "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
        "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
      },
    }

    const response = await axios.request(options)
    return { symbol, price: response.data.price }
  }
)

export const addInvestment = createAsyncThunk(
  "investments/addInvestment",
  async (investment: Omit<Investment, "id" | "currentPrice">) => {
    // Simulate API call
    return {
      ...investment,
      id: Math.random().toString(36).substring(2, 9),
      currentPrice: investment.buyPrice, // Will be updated later
    }
  }
)

const investmentSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    selectInvestment: (state, action: PayloadAction<string>) => {
      state.selectedInvestment =
        state.investments.find((inv) => inv.id === action.payload) || null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.investments = state.investments.map((inv) =>
          inv.symbol === action.payload.symbol
            ? { ...inv, currentPrice: action.payload.price }
            : inv
        )
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to fetch price"
      })
      .addCase(addInvestment.fulfilled, (state, action) => {
        state.investments.push(action.payload)
      })
  },
})

export const { setFilter, selectInvestment } = investmentSlice.actions
export default investmentSlice.reducer
