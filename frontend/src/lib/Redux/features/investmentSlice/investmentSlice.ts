/** @format */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import axios, { AxiosError } from "axios"
import { useAppDispatch } from "../../store/hooks"

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
}

const API_KEYS = [
  process.env.NEXT_PUBLIC_RAPIDAPI1,
  process.env.NEXT_PUBLIC_RAPIDAPI2,
  process.env.NEXT_PUBLIC_RAPIDAPI3,
].filter(Boolean) as string[]

API_KEYS.forEach((key) => {
  initialState.apiKeyStatus[key] = {
    valid: true,
    lastChecked: new Date(0).toISOString(),
  }
})

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

const fetchCurrentPrice = async (
  symbol: string,
  currentApiKeyIndex: number,
  apiKeyStatus: InvestmentState["apiKeyStatus"]
): Promise<{ price: number; apiKeyIndex: number }> => {
  let attempts = 0
  let apiKeyIndex = currentApiKeyIndex
  let lastError: Error | null = null

  while (attempts < API_KEYS.length * 2) {
    const apiKey = API_KEYS[apiKeyIndex]

    if (
      !apiKeyStatus[apiKey]?.valid &&
      !isApiKeyStale(apiKeyStatus[apiKey]?.lastChecked)
    ) {
      apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
      attempts++
      continue
    }

    try {
      const response = await axios.get(
        "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
        {
          params: {
            region: symbol.endsWith(".NS") ? "IN" : "US",
            symbol,
          },
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
          },
        }
      )

      if (
        response.data?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw
      ) {
        apiKeyStatus[apiKey] = {
          valid: true,
          lastChecked: new Date().toISOString(),
        }

        return {
          price:
            response.data.quoteSummary.result[0].price.regularMarketPrice.raw,
          apiKeyIndex,
        }
      }
      throw new Error("Invalid API response structure")
    } catch (error) {
      lastError = error as Error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429 || error.response?.status === 403) {
          apiKeyStatus[apiKey] = {
            valid: false,
            lastChecked: new Date().toISOString(),
          }
        }
      }

      apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
      attempts++
      await new Promise((resolve) =>
        setTimeout(resolve, 200 * Math.pow(2, attempts))
      )
    }
  }

  throw (
    lastError || new Error(`Failed to fetch price after ${attempts} attempts`)
  )
}

export const fetchStockPrice = createAsyncThunk(
  "investments/fetchStockPrice",
  async (symbol: string, { getState, rejectWithValue }) => {
    const state = getState() as { investments: InvestmentState }
    const { priceCache, currentApiKeyIndex, apiKeyStatus } = state.investments

    const cachedPrice = priceCache[symbol]
    if (cachedPrice && !isPriceStale(cachedPrice.timestamp)) {
      return {
        symbol,
        price: cachedPrice.price,
        apiKeyIndex: currentApiKeyIndex,
        fromCache: true,
      }
    }

    try {
      const { price, apiKeyIndex } = await fetchCurrentPrice(
        symbol,
        currentApiKeyIndex,
        apiKeyStatus
      )
      return { symbol, price, apiKeyIndex, fromCache: false }
    } catch (error) {
      if (cachedPrice) {
        return {
          symbol,
          price: cachedPrice.price,
          apiKeyIndex: currentApiKeyIndex,
          fromCache: true,
          error: "Using stale cache after fetch failure",
        }
      }
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch price"
      )
    }
  }
)

export const addInvestment = createAsyncThunk(
  "investments/addInvestment",
  async (
    investmentData: Omit<
      Investment,
               "lastPriceUpdate"
    >,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const newInvestment: Investment = {
        ...investmentData,
      
       
        lastPriceUpdate: new Date().toISOString(),
      
      }
      console.log(newInvestment)
      

      dispatch(investmentSlice.actions.addBackendInvestment(newInvestment))

      const priceResult = await dispatch(fetchStockPrice(investmentData.symbol))
      console.log(priceResult)
      if (fetchStockPrice.fulfilled.match(priceResult)) {
        const updatedInvestment = {
          ...newInvestment,
          currentValue: priceResult.payload.price * newInvestment.quantity,
          updatedAt: new Date().toISOString(),
        }
        return updatedInvestment
      } else {
        throw new Error("Failed to fetch current price")
      }
    } catch (error) {
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
      return { skipped: true }
    }

    const batchSize = 5
    const investments = state.investments.investments
    let failedCount = 0

    for (let i = 0; i < investments.length; i += batchSize) {
      const batch = investments.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map((inv) => dispatch(fetchStockPrice(inv.symbol)))
      )
      failedCount += results.filter((r) => r.status === "rejected").length

      if (i + batchSize < investments.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return { skipped: false, failed: failedCount }
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
    },
    updateInvestmentCurrentValue: (
      state,
      action: PayloadAction<{ id: string; currentValue: number }>
    ) => {
      const index = state.investments.findIndex(
        (inv) => inv.id === action.payload.id
      )
      if (index >= 0) {
        state.investments[index].currentValue = action.payload.currentValue
        state.investments[index].updatedAt = new Date().toISOString()
        state.investments[index].lastPriceUpdate = new Date().toISOString()
      }
    },
    deleteInvestment: (state, action: PayloadAction<string>) => {
      state.investments = state.investments.filter(
        (inv) => inv.id !== action.payload
      )
      if (state.selectedInvestment?.id === action.payload) {
        state.selectedInvestment = null
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    clearInvestments: (state) => {
      state.investments = []
      state.selectedInvestment = null
      state.status = "idle"
      state.error = null
      state.filters = initialState.filters
      state.priceCache = {}
      state.lastFetchTime = null
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        const { symbol, price, apiKeyIndex, fromCache } = action.payload

        if (!fromCache) {
          state.priceCache[symbol] = {
            price,
            timestamp: new Date().toISOString(),
          }
          state.currentApiKeyIndex = apiKeyIndex
        }

        state.investments = state.investments.map((inv) => {
          if (inv.symbol === symbol) {
            return {
              ...inv,
              currentValue: price * inv.quantity,
              updatedAt: new Date().toISOString(),
              lastPriceUpdate: new Date().toISOString(),
            }
          }
          return inv
        })

        state.status = "succeeded"
        state.lastFetchTime = new Date().toISOString()
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })
      .addCase(addInvestment.pending, (state) => {
        state.status = "loading"
      })
      .addCase(addInvestment.fulfilled, (state, action) => {
        const index = state.investments.findIndex(
          (inv) => inv.id === action.payload.id
        )
        if (index >= 0) {
          state.investments[index] = action.payload
        }
        state.status = "succeeded"
        state.lastFetchTime = new Date().toISOString()
      })
      .addCase(addInvestment.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
        if (action.meta.arg) {
          state.investments = state.investments.filter(
            (inv) => inv.symbol !== action.meta.arg.symbol
          )
        }
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
        state.error = "Failed to refresh some investments"
      })
  },
})

export const {
  setFilter,
  selectInvestment,
  addBackendInvestment,
  updateInvestmentCurrentValue,
  deleteInvestment,
  resetFilters,
  clearInvestments,
  resetApiKeyStatus,
} = investmentSlice.actions

export default investmentSlice.reducer
