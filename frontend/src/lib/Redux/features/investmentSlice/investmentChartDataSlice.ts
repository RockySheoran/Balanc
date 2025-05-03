// src/lib/Redux/slices/investmentChartDataSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios from "axios"
import { RootState } from "../store"

interface ChartDataItem {
  symbol: string
  data: any
  timestamp: number
  range: string
  interval: string
}

interface ChartDataState {
  data: ChartDataItem[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

const initialState: ChartDataState = {
  data: [],
  loading: false,
  error: null,
  lastUpdated: null,
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

export const fetchChartData = createAsyncThunk(
  "investmentChartData/fetchChartData",
  async (
    { symbol, range, interval, apiKey }: 
    { symbol: string; range: string; interval: string; apiKey: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState
      const cachedData = state.investmentChartData.data.find(
        item => item.symbol === symbol && 
               item.range === range && 
               item.interval === interval &&
               Date.now() - item.timestamp < CACHE_TTL
      )

      if (cachedData) {
        return cachedData
      }

      const response = await axios.get(
        `https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart`,
        {
          params: { symbol, range, interval, region: symbol.includes(".NS") ? "IN" : "US" },
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
          },
          timeout: 8000,
        }
      )

      if (!response.data?.chart?.result?.[0]) {
        throw new Error("Invalid response structure")
      }

      return {
        symbol,
        data: response.data,
        range,
        interval,
        timestamp: Date.now()
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.message)
      }
      return rejectWithValue("An unknown error occurred")
    }
  }
)

const investmentChartDataSlice = createSlice({
  name: "investmentChartData",
  initialState,
  reducers: {
    clearChartData: (state) => {
      state.data = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChartData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChartData.fulfilled, (state, action: PayloadAction<ChartDataItem>) => {
        // Remove existing data for this symbol/range/interval if it exists
        state.data = state.data.filter(
          item => !(
            item.symbol === action.payload.symbol &&
            item.range === action.payload.range &&
            item.interval === action.payload.interval
          )
        )
        // Add new data
        state.data.push(action.payload)
        state.loading = false
        state.lastUpdated = Date.now()
      })
      .addCase(fetchChartData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { clearChartData } = investmentChartDataSlice.actions
export default investmentChartDataSlice.reducer