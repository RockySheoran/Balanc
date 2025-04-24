/** @format */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../store/store";

// Types and Interfaces
interface Investment {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  symbol: string;
  type: "STOCK" | "CRYPTO" | "MUTUAL_FUND" | "EXPENSE";
  amount: number;
  quantity: number;
  buyDate: string;
  sellDate: string | null;
  buyPrice: number;
  sellPrice: number | null;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
  lastPriceUpdate?: string;
}

interface Filters {
  dateRange: "1m" | "3m" | "6m" | "1y" | "all";
  performanceFilter: "all" | "profit" | "loss" | "best";
  searchTerm: string;
}

interface InvestmentState {
  investments: Investment[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedInvestment: Investment | null;
  filters: Filters;
  priceCache: Record<string, { price: number; timestamp: string }>;
  lastFetchTime: string | null;
  currentApiKeyIndex: number;
  apiKeyStatus: Record<string, { valid: boolean; lastChecked: string }>;
}

// Constants
const STALE_PRICE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const STALE_DATA_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_KEY_CHECK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const API_RETRY_DELAY_BASE_MS = 200;
const MAX_API_RETRIES = 3; // Increased retries to attempt more keys
const API_KEYS = (
  [
    process.env.NEXT_PUBLIC_RAPIDAPI1,
    process.env.NEXT_PUBLIC_RAPIDAPI2,
    process.env.NEXT_PUBLIC_RAPIDAPI3,
    process.env.NEXT_PUBLIC_RAPIDAPI4,
    process.env.NEXT_PUBLIC_RAPIDAPI5,
    process.env.NEXT_PUBLIC_RAPIDAPI6,
    process.env.NEXT_PUBLIC_RAPIDAPI7,
    process.env.NEXT_PUBLIC_RAPIDAPI8,
    process.env.NEXT_PUBLIC_RAPIDAPI9,
    process.env.NEXT_PUBLIC_RAPIDAPI10,
  ].filter(Boolean) as string[]
).filter(Boolean) as string[];

// Initialize state
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
  apiKeyStatus: Object.fromEntries(
    API_KEYS.map((key) => [
      key,
      { valid: true, lastChecked: new Date(0).toISOString() },
    ])
  ),
};

// Helper functions
const isStale = (timestamp: string | undefined | null, thresholdMs: number): boolean => {
  if (!timestamp) return true;
  return new Date(timestamp) < new Date(Date.now() - thresholdMs);
};

const getNextValidApiKey = (
  currentIndex: number,
  apiKeyStatus: InvestmentState["apiKeyStatus"]
): { key: string; index: number } | null => {
  for (let i = 0; i < API_KEYS.length; i++) {
    const index = (currentIndex + i) % API_KEYS.length;
    const key = API_KEYS[index];

    // Skip invalid keys unless their status is stale
    if (
      apiKeyStatus[key]?.valid ||
      isStale(apiKeyStatus[key]?.lastChecked, API_KEY_CHECK_THRESHOLD_MS)
    ) {
      return { key, index };
    }
  }
  return null;
};

// API Service
const fetchStockPriceFromApi = async (
  symbol: string,
  apiKey: string
): Promise<number> => {
  try {
    const response = await axios.get(
      "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
      {
        params: {
          region: symbol.endsWith(".NS") ? "IN" : "US",
          symbol,
        },
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "yahoo-finance166.p.rapidapi.com",
        },
        timeout: 5000, // 5 second timeout
      }
    );

    const price =
      response.data?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw;
    if (typeof price !== "number") {
      throw new Error("Invalid API response structure");
    }
    return price;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.status === 429
        ? "Rate limit exceeded"
        : error.response?.status === 403
          ? "Forbidden"
          : error.message;
      throw new Error(message);
    }
    throw error;
  }
};

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchStockPrice",
  async (symbol: string, { getState, rejectWithValue }) => {
    const state = (getState() as RootState).investment;

    if (!state) {
      return rejectWithValue("Investments state not initialized");
    }

    const { priceCache, currentApiKeyIndex, apiKeyStatus } = state;

    // Check cache first
    const cachedPrice = priceCache[symbol];
    if (cachedPrice && !isStale(cachedPrice.timestamp, STALE_PRICE_THRESHOLD_MS)) {
      return {
        symbol,
        price: cachedPrice.price,
        apiKeyIndex: currentApiKeyIndex,
        fromCache: true,
      };
    }

    let lastError: Error | null = null;
    let currentKeyIndex = currentApiKeyIndex;
    let attempts = 0;
    let successful = false;
    let successfulApiKeyIndex = currentApiKeyIndex;

    while (attempts < API_KEYS.length * MAX_API_RETRIES && !successful) {
      const keyInfo = getNextValidApiKey(currentKeyIndex, apiKeyStatus);
      if (!keyInfo) break;

      const { key, index } = keyInfo;
      currentKeyIndex = index;

      try {
        const price = await fetchStockPriceFromApi(symbol, key);

        // Update API key status on success
        apiKeyStatus[key] = {
          valid: true,
          lastChecked: new Date().toISOString(),
        };
        successful = true;
        successfulApiKeyIndex = index;

        return {
          symbol,
          price,
          apiKeyIndex: index,
          fromCache: false,
        };
      } catch (error) {
        lastError = error as Error;
        attempts++;

        // Mark key as invalid if rate limited or forbidden
        if (error instanceof Error && (error.message.includes("Rate limit") || error.message.includes("Forbidden"))) {
          apiKeyStatus[key] = {
            valid: false,
            lastChecked: new Date().toISOString(),
          };
          console.warn(`API key ${key.slice(-4)} marked as invalid due to: ${error.message}`);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_BASE_MS * Math.pow(2, attempts)));
      }
    }

    // If all attempts failed, fallback to stale cache if available
    if (!successful && cachedPrice) {
      return {
        symbol,
        price: cachedPrice.price,
        apiKeyIndex: currentApiKeyIndex,
        fromCache: true,
        error: "Using stale cache after fetch failure",
      };
    }

    // If no successful fetch and no stale cache, reject
    if (!successful) {
      return rejectWithValue(
        lastError?.message || "Failed to fetch price after all valid API keys were tried"
      );
    }

    // If we succeeded at some point, the fulfilled case will handle the state update
    return { symbol, price: -1, apiKeyIndex: successfulApiKeyIndex, fromCache: false }; // Dummy return to satisfy TS, actual value handled in fulfilled
  }
);

export const addInvestment = createAsyncThunk(
  "investments/addInvestment",
  async (
    investmentData: Omit<Investment, "lastPriceUpdate">,
    { dispatch, rejectWithValue }
  ) => {
    const newInvestment: Investment = {
      ...investmentData,
      lastPriceUpdate: new Date().toISOString(),
    };

    // Optimistic update
    dispatch(investmentSlice.actions.addBackendInvestment(newInvestment));

    try {
      const priceResult = await dispatch(fetchStockPrice(investmentData.symbol));
console.log(priceResult)
      if (fetchStockPrice.fulfilled.match(priceResult)) {
        return {
          ...newInvestment,
          currentValue: priceResult.payload.price * newInvestment.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      throw new Error("Price fetch failed");
    } catch (error) {
      // Keep the investment even if price fetch fails
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to add investment",
        investment: newInvestment
      });
    }
  }
);

export const refreshAllInvestments = createAsyncThunk(
  "investments/refreshAll",
  async (_, { getState, dispatch }) => {
    const state = (getState() as RootState).investment;

    // Skip if data isn't stale
    if (!state || !isStale(state.lastFetchTime, STALE_DATA_THRESHOLD_MS)) {
      return { skipped: true };
    }

    const batchSize = 5;
    const investments = state.investments.filter(inv => inv.type === "STOCK"); // Only refresh stock prices
    let failedCount = 0;

    // Process in batches with delay between them
    for (let i = 0; i < investments.length; i += batchSize) {
      const batch = investments.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(inv => dispatch(fetchStockPrice(inv.symbol)))
      );
      failedCount += results.filter(r => r.status === "rejected").length;

      // Add delay between batches except the last one
      if (i + batchSize < investments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { skipped: false, failed: failedCount };
  }
);

// Slice
const investmentSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    selectInvestment: (state, action: PayloadAction<string>) => {
      state.selectedInvestment =
        state.investments.find((inv) => inv.id === action.payload) || null;
    },
    addBackendInvestment: (state, action: PayloadAction<Investment>) => {
      const existingIndex = state.investments.findIndex(
        (inv) => inv.id === action.payload.id
      );
      if (existingIndex >= 0) {
        state.investments[existingIndex] = action.payload;
      } else {
        state.investments.push(action.payload);
      }
    },

    updateSellPrice: (
      state,
      action: PayloadAction<{
        id: string;
        sellPrice: number | null;
        sellDate: string | null;
      }>
    ) => {
      const { id, sellPrice, sellDate } = action.payload;
      const index = state.investments.findIndex((inv) => inv.id === id);

      if (index >= 0) {
        state.investments[index] = {
          ...state.investments[index],
          sellPrice,
          sellDate,
          updatedAt: new Date().toISOString(),
        };
        // If we're updating the currently selected investment, update that too
        if (state.selectedInvestment?.id === id) {
          state.selectedInvestment = state.investments[index];
        }
      }
    },
    updateInvestmentCurrentValue: (
      state,
      action: PayloadAction<{ id: string; currentValue: number }>
    ) => {
      const index = state.investments.findIndex(
        (inv) => inv.id === action.payload.id
      );
      if (index >= 0) {
        state.investments[index] = {
          ...state.investments[index],
          currentValue: action.payload.currentValue,
          updatedAt: new Date().toISOString(),
          lastPriceUpdate: new Date().toISOString(),
        };
      }
    },
    deleteInvestment: (state, action: PayloadAction<string>) => {
      state.investments = state.investments.filter(
        (inv) => inv.id !== action.payload
      );
      if (state.selectedInvestment?.id === action.payload) {
        state.selectedInvestment = null;
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearInvestments: (state) => {
      state.investments = [];
      state.selectedInvestment = null;
      state.status = "idle";
      state.error = null;
      state.filters = initialState.filters;
      state.priceCache = {};
      state.lastFetchTime = null;
      state.currentApiKeyIndex = 0;
      state.apiKeyStatus = Object.fromEntries(
        API_KEYS.map((key) => [
          key,
          { valid: true, lastChecked: new Date(0).toISOString() },
        ])
      );
    },
    resetApiKeyStatus: (state, action: PayloadAction<string>) => {
      const apiKey = action.payload;
      if (state.apiKeyStatus[apiKey]) {
        state.apiKeyStatus[apiKey] = {
          valid: true,
          lastChecked: new Date().toISOString(),
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchStockPrice cases
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        const { symbol, price, apiKeyIndex, fromCache } = action.payload;

        if (!fromCache) {
          state.priceCache[symbol] = {
            price,
            timestamp: new Date().toISOString(),
          };
          state.currentApiKeyIndex = apiKeyIndex;
        }

        // Update investments efficiently
        state.investments = state.investments.map((inv) =>
          inv.symbol === symbol && inv.type === "STOCK"
            ? {
              ...inv,
              currentValue: price * inv.quantity,
              updatedAt: new Date().toISOString(),
              lastPriceUpdate: new Date().toISOString(),
            }
            : inv
        );

        state.status = "succeeded";
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });

    // Handle addInvestment cases
    builder
      .addCase(addInvestment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addInvestment.fulfilled, (state, action) => {
        const index = state.investments.findIndex(
          (inv) => inv.id === action.payload.id
        );
        if (index >= 0) {
          state.investments[index] = action.payload;
        }
        state.status = "succeeded";
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(addInvestment.rejected, (state, action) => {
        const { message, investment } = action.payload as {
          message: string;
          investment?: Investment;
        };
        state.status = "failed";
        state.error = message || "Unknown error";

        // If we have the investment data in the payload, keep it
        if (investment) {
          const existingIndex = state.investments.findIndex(
            (inv) => inv.id === investment.id
          );
          if (existingIndex >= 0) {
            state
            state.investments[existingIndex] = investment;
          } else {
            state.investments.push(investment);
          }
        }
      });
    // Handle refreshAllInvestments cases
    builder
      .addCase(refreshAllInvestments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(refreshAllInvestments.fulfilled, (state, action) => {
        state.status = action.payload.skipped ? "idle" : "succeeded";
        if (!action.payload.skipped) {
          state.lastFetchTime = new Date().toISOString();
        }
      })
      .addCase(refreshAllInvestments.rejected, (state) => {
        state.status = "failed";
        state.error = "Failed to refresh some investments";
      });
  },
});

export const {
  setFilter,
  selectInvestment,
  addBackendInvestment,
  updateInvestmentCurrentValue,
  deleteInvestment,
  resetFilters,
  updateSellPrice,
  clearInvestments,
  resetApiKeyStatus,
} = investmentSlice.actions;

export default investmentSlice.reducer;