/** @format */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios, { AxiosError } from "axios"

interface Investment {
  id: string
  userId: string
  accountId: string
  name: string
  symbol: string
  type: "STOCK" | "CRYPTO" | "MUTUAL_FUND" | "EXPENSE"
  amount: number
  quantity: number
  buyDate: string
  sellDate: string | null
  buyPrice: number
  sellPrice: number | null
  currentValue: number
  createdAt: string
  updatedAt: string
  lastPriceUpdate?: string
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
  priceCache: Record<string, { price: number; timestamp: string }>
  lastFetchTime: string | null
  currentApiKeyIndex: number
  apiKeyStatus: Record<string, { valid: boolean; lastChecked: string }>
  retryCount: number
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
  priceCache: {},
  lastFetchTime: null,
  currentApiKeyIndex: 0,
  apiKeyStatus: {},
  retryCount: 0,
}

// API Keys configuration
const API_KEYS = [
  process.env.NEXT_PUBLIC_RAPIDAPI1 || "default_key_1",
  process.env.NEXT_PUBLIC_RAPIDAPI2 || "default_key_2",
  process.env.NEXT_PUBLIC_RAPIDAPI3 || "default_key_3",
].filter((key) => key.length > 0)

// Initialize API key status
API_KEYS.forEach((key) => {
  initialState.apiKeyStatus[key] = {
    valid: true,
    lastChecked: new Date(0).toISOString(),
  }
})

// Cache and staleness helpers
const isPriceStale = (timestamp: string): boolean => {
  return new Date(timestamp) < new Date(Date.now() - 60 * 60 * 1000)
}

const isDataStale = (timestamp: string | null): boolean => {
  return (
    !timestamp ||
    new Date(timestamp) < new Date(Date.now() - 24 * 60 * 60 * 1000)
  )
}

const isApiKeyStale = (lastChecked: string): boolean => {
  return new Date(lastChecked) < new Date(Date.now() - 5 * 60 * 1000)
}

// Enhanced fetch function with retry and key rotation
const fetchWithRetry = async (
  symbol: string,
  currentApiKeyIndex: number,
  apiKeyStatus: InvestmentState["apiKeyStatus"],
  maxRetries = API_KEYS.length * 3, // More retry attempts
  baseDelay = 500 // Initial delay in ms
): Promise<{ price: number; apiKeyIndex: number }> => {
  let attempts = 0
  let apiKeyIndex = currentApiKeyIndex
  let lastError: any = null

  while (attempts < maxRetries) {
    const apiKey = API_KEYS[apiKeyIndex]

    // Skip recently failed keys unless they're stale
    if (
      !apiKeyStatus[apiKey]?.valid &&
      !isApiKeyStale(apiKeyStatus[apiKey]?.lastChecked)
    ) {
      apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
      attempts++
      continue
    }

    try {
      const response = await axios.request({
        method: "GET",
        url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
        params: { region: symbol.endsWith(".NS") ? "IN" : "US", symbol },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
        },
        timeout: 8000,
      })

      // Validate response structure
      if (
        response.data?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw
      ) {
        return {
          price:
            response.data.quoteSummary.result[0].price.regularMarketPrice.raw,
          apiKeyIndex,
        }
      }
      throw new Error("Invalid API response structure")
    } catch (error: any) {
      lastError = error

      // Update key status based on error
      if (
        error.response?.status === 429 ||
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        apiKeyStatus[apiKey] = {
          valid: false,
          lastChecked: new Date().toISOString(),
        }
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        5000, // max delay
        baseDelay * Math.pow(2, attempts) + Math.random() * 500
      )

      await new Promise((resolve) => setTimeout(resolve, delay))

      // Rotate to next key
      apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
      attempts++
    }
  }

  throw (
    lastError || new Error(`All API keys failed after ${maxRetries} attempts`)
  )
}

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchStockPrice",
  async (symbol: string, { getState, rejectWithValue }) => {
    const state = getState() as { investments: InvestmentState }
    const { priceCache, currentApiKeyIndex, apiKeyStatus } = state.investments

    // Check cache first
    if (priceCache[symbol] && !isPriceStale(priceCache[symbol].timestamp)) {
      return {
        symbol,
        price: priceCache[symbol].price,
        apiKeyIndex: currentApiKeyIndex,
        fromCache: true,
      }
    }

    try {
      const { price, apiKeyIndex } = await fetchWithRetry(
        symbol,
        currentApiKeyIndex,
        apiKeyStatus
      )
      return { symbol, price, apiKeyIndex, fromCache: false }
    } catch (error) {
      console.error("Price fetch error:", error)

      // Fallback to cached price if available (even if stale)
      if (priceCache[symbol]) {
        return {
          symbol,
          price: priceCache[symbol].price,
          apiKeyIndex: currentApiKeyIndex,
          fromCache: true,
          error: "Using stale cache after fetch failure",
        }
      }

      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown price fetch error"
      )
    }
  }
)

export const addInvestment = createAsyncThunk(
  "investments/addInvestment",
  async (
    investmentData: Omit<
      Investment,
      "id" | "createdAt" | "updatedAt" | "currentValue" | "lastPriceUpdate"
    >,
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { investments: InvestmentState }

    try {
      // Try to get price (with retry logic)
      const { price } = await fetchWithRetry(
        investmentData.symbol,
        state.investments.currentApiKeyIndex,
        state.investments.apiKeyStatus
      )

      const newInvestment: Investment = {
        ...investmentData,
        currentValue: price ,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastPriceUpdate: new Date().toISOString(),
      }

      return newInvestment
    } catch (error) {
      console.error("Add investment error:", error)
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add investment"
      )
    }
  }
)

export const refreshAllInvestments = createAsyncThunk(
  "investments/refreshAll",
  async (_, { getState, dispatch }) => {
    const state = getState() as { investments: InvestmentState }

    if (!isDataStale(state.investments.lastFetchTime)) {
      return { skipped: true, count: state.investments.investments.length }
    }

    const results = await Promise.allSettled(
      state.investments.investments.map((inv) =>
        dispatch(fetchStockPrice(inv.symbol))
      )
    )

    const failed = results.filter((r) => r.status === "rejected").length
    if (failed > 0) {
      console.warn(`Failed to refresh ${failed} investments`)
    }

    return {
      skipped: false,
      count: state.investments.investments.length,
      failed,
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
    addBackendInvestment: (state, action: PayloadAction<Investment>) => {
      const existingIndex = state.investments.findIndex(
        (inv) => inv.id === action.payload.id
      )
      if (existingIndex >= 0) {
        state.investments[existingIndex] = action.payload
      } else {
        state.investments.push(action.payload)
      }
      state.lastFetchTime = new Date().toISOString()
    },
    updateAllCurrentValues: (state) => {
      if (!isDataStale(state.lastFetchTime)) return
      state.status = "loading"
    },
    deleteInvestment: (state, action: PayloadAction<string>) => {
      state.investments = state.investments.filter(
        (inv) => inv.id !== action.payload
      )
      if (state.selectedInvestment?.id === action.payload) {
        state.selectedInvestment = null
      }
    },
    clearInvestments: (state) => {
      state.investments = []
      state.selectedInvestment = null
      state.status = "idle"
      state.error = null
      state.filters = initialState.filters
      state.priceCache = {}
      state.lastFetchTime = null
      state.retryCount = 0
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    resetApiKeyStatus: (state, action: PayloadAction<string>) => {
      const apiKey = action.payload
      if (state.apiKeyStatus[apiKey]) {
        state.apiKeyStatus[apiKey] = {
          valid: true,
          lastChecked: new Date().toISOString(),
        }
      }
    },
    incrementRetryCount: (state) => {
      state.retryCount += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        state.status = "succeeded"
        const { symbol, price, apiKeyIndex, fromCache } = action.payload

        // Update cache if not from cache
        if (!fromCache) {
          state.priceCache[symbol] = {
            price,
            timestamp: new Date().toISOString(),
          }
          state.currentApiKeyIndex = apiKeyIndex

          // Update investments with this symbol
          state.investments = state.investments.map((inv) => {
            if (inv.symbol === symbol) {
              return {
                ...inv,
                currentValue: price ,
                updatedAt: new Date().toISOString(),
                lastPriceUpdate: new Date().toISOString(),
              }
            }
            return inv
          })
        }
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Price fetch failed"
        state.retryCount += 1
      })
      .addCase(addInvestment.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(addInvestment.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.investments.push(action.payload)
        state.lastFetchTime = new Date().toISOString()
      })
      .addCase(addInvestment.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) || "Add investment failed"
      })
      .addCase(refreshAllInvestments.pending, (state) => {
        state.status = "loading"
      })
      .addCase(refreshAllInvestments.fulfilled, (state, action) => {
        state.status = action.payload.skipped ? "idle" : "succeeded"
        if (!action.payload.skipped) {
          state.lastFetchTime = new Date().toISOString()
        }
      })
      .addCase(refreshAllInvestments.rejected, (state) => {
        state.status = "failed"
        state.error = "Bulk refresh failed"
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
  resetApiKeyStatus,
  incrementRetryCount,
} = investmentSlice.actions

export default investmentSlice.reducer
