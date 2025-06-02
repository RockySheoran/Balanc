/** @format */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../store/store";

// Types
interface Filters {
  dateRange: "1m" | "3m" | "6m" | "1y" | "all";
  performanceFilter: "all" | "profit" | "loss" | "best";
  searchTerm: string;
}

interface Investment {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  symbol: string;
  type: "STOCK" | "CRYPTO" | "MUTUAL_FUND" | "EXPENSE";
  amount: number;
  quantity: number;
  buyDate: string | Date | null | undefined;
  sellDate: string | null;
  buyPrice: number;
  sellPrice: number | null;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
  lastPriceUpdate: string;
  nextRefreshTime: string;
  refreshAttempts: number;
}

interface CachedPrice {
  price: number;
  timestamp: number;
  currency: "USD" | "INR";
}

interface ApiKeyStatus {
  valid: boolean;
  lastUsed: number;
  errorCount: number;
  retryAfter?: number;
  lastError?: string;
}

interface InvestmentState {
  investments: Investment[];
  status: "idle" | "loading" | "succeeded" | "failed";
  filters: Filters;
  error: string | null;
  priceCache: Record<string, CachedPrice>;
  apiKeys: {
    keys: string[];
    currentIndex: number;
    status: Record<string, ApiKeyStatus>;
    lastSuccessfulKey: string | null;
  };
  lastAutoRefresh: string | null;
  refreshIntervalId: NodeJS.Timeout | null;
}

// Constants
const API_CONFIG = {
  stalePriceThresholdMs: 60 * 60 * 1000, // 1 hour (changed from 10 minutes)
  retryDelayMs: 1000,
  maxRetriesPerKey: 2,
  keyCooldownMs: 60 * 60 * 1000, // 1 hour
  maxErrorsBeforeDisable: 5,
  inrToUsdRate: 85,
  priceRefreshIntervalMs: 60 * 60 * 1000, // 1 hour (changed from 12 hours)
  cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
  keyResetIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  backgroundRefreshDelay: 5000, // 5 seconds delay between background refreshes
  maxBackgroundRefreshAttempts: 3, // Max attempts for background refresh
  backgroundRefreshInitialDelay: 30 * 1000, // 30 seconds delay before first refresh
  backgroundRefreshInterval: 60 * 60 * 1000, // 1 hour between refreshes (changed from 12 hours)
  maxConcurrentRefreshes: 3, // Max concurrent refresh operations
  refreshJitter: 0.2, // ±20% random variation in refresh timing
};

// Helper functions
function getCurrentApiKeys(): string[] {
  const keys = [
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
  ].filter((key): key is string => Boolean(key));

  if (keys.length === 0) {
    throw new Error("No valid API keys found in environment variables!");
  }
  return keys;
}

function calculateNextRefreshTime(): string {
  const jitter = 1 + (Math.random() * 2 - 1) * API_CONFIG.refreshJitter;
  const refreshTime = Date.now() + API_CONFIG.priceRefreshIntervalMs * jitter;
  return new Date(refreshTime).toISOString();
}

function logApiError(error: unknown, context: string, extra?: Record<string, unknown>) {
  if (axios.isAxiosError(error)) {
    console.error(`API Error (${context}):`, {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      ...extra,
    });
  } else {
    console.error(`Error (${context}):`, error, extra);
  }
}

function calculateCooldown(error: AxiosError): number {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    return retryAfter ? parseInt(retryAfter) * 1000 : API_CONFIG.keyCooldownMs;
  }
  return API_CONFIG.retryDelayMs;
}

function getNextValidKey(state: InvestmentState): { key: string; index: number } | null {
  const { keys, status, lastSuccessfulKey } = state.apiKeys;
  
  if (lastSuccessfulKey) {
    const keyStatus = status[lastSuccessfulKey] || { valid: true, errorCount: 0 };
    if (keyStatus.valid && (!keyStatus.retryAfter || Date.now() > keyStatus.retryAfter)) {
      const index = keys.indexOf(lastSuccessfulKey);
      if (index !== -1) return { key: lastSuccessfulKey, index };
    }
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const keyStatus = status[key] || { valid: true, errorCount: 0 };
    if (keyStatus.valid && (!keyStatus.retryAfter || Date.now() > keyStatus.retryAfter)) {
      return { key, index: i };
    }
  }

  return null;
}

// Initial state
const initialState: InvestmentState = {
  investments: [],
  status: "idle",
  filters: {
    dateRange: "all",
    performanceFilter: "all",
    searchTerm: "",
  },
  error: null,
  priceCache: {},
  apiKeys: {
    keys: getCurrentApiKeys(),
    currentIndex: 0,
    status: {},
    lastSuccessfulKey: null,
  },
  lastAutoRefresh: null,
  refreshIntervalId: null,
};

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchPrice",
  async (
    { symbol, backgroundRefresh = false, attempt = 1 }: { 
      symbol: string; 
      backgroundRefresh?: boolean;
      attempt?: number;
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    const state = (getState() as RootState).investments;
    const cleanSymbol = symbol.toUpperCase();
    const isIndianStock = cleanSymbol.endsWith(".NS");
    const cacheKey = `${cleanSymbol}-${isIndianStock ? "INR" : "USD"}`;

    if (!backgroundRefresh) {
      const cachedPrice = state.priceCache[cacheKey];
      if (cachedPrice && Date.now() - cachedPrice.timestamp < API_CONFIG.stalePriceThresholdMs) {
        return {
          symbol: cleanSymbol,
          price: cachedPrice.price,
          currency: cachedPrice.currency,
          fromCache: true,
        };
      }
    }

    const keyInfo = getNextValidKey(state);
    if (!keyInfo) return rejectWithValue("No valid API keys available");

    const { key, index } = keyInfo;

    try {
      const response = await axios.get(
        "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
        {
          params: {
            region: isIndianStock ? "IN" : "US",
            symbol: cleanSymbol,
          },
          headers: {
            "X-RapidAPI-Key": key,
            "X-RapidAPI-Host": "yahoo-finance166.p.rapidapi.com",
          },
          timeout: 5000,
        }
      );

      const price = response.data?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw;
      if (typeof price !== "number") throw new Error("Invalid price data in response");

      const finalPrice = isIndianStock ? price / API_CONFIG.inrToUsdRate : price;
      const currency = isIndianStock ? "INR" : "USD";

      dispatch(markApiKeySuccess({ key, index }));
      
      return {
        symbol: cleanSymbol,
        price: parseFloat(finalPrice.toFixed(2)),
        currency,
        fromCache: false,
      };
    } catch (error) {
      logApiError(error, `fetchStockPrice(${cleanSymbol})`, { attempt, backgroundRefresh });

      if (axios.isAxiosError(error)) {
        const cooldownMs = calculateCooldown(error);
        dispatch(markApiKeyFailure({ key, cooldownMs, error: error.message }));

        if (error.response?.status === 429 && attempt < API_CONFIG.maxRetriesPerKey) {
          return dispatch(fetchStockPrice({ 
            symbol, 
            backgroundRefresh, 
            attempt: attempt + 1 
          })).unwrap();
        }
      }

      if (!backgroundRefresh) {
        const cachedPrice = state.priceCache[cacheKey];
        if (cachedPrice) {
          return {
            symbol: cleanSymbol,
            price: cachedPrice.price,
            currency: cachedPrice.currency,
            fromCache: true,
            error: "Using stale cache",
          };
        }
      }

      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch price");
    }
  }
);

export const addInvestments = createAsyncThunk(
  "investments/add",
  async (
    investmentData: Omit<Investment,  "updatedAt" | "lastPriceUpdate" | "nextRefreshTime" | "refreshAttempts">,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const newInvestment: Investment = {
        ...investmentData,  
        updatedAt: new Date().toISOString(),
        lastPriceUpdate: new Date().toISOString(),
        nextRefreshTime: calculateNextRefreshTime(),
        refreshAttempts: 0,
      };

      dispatch(addInvestmentToState(newInvestment));

      if (newInvestment.sellPrice === null) {
        const priceResult = await dispatch(
          fetchStockPrice({ symbol: newInvestment.symbol })
        ).unwrap();
        
        dispatch(
          updateInvestmentValue({
            id: newInvestment.id,
            price: priceResult.price,
            lastPriceUpdate: new Date().toISOString(),
          })
        );
      }

      return newInvestment;
    } catch (error) {
      logApiError(error, "addInvestment", { investmentData });
      return rejectWithValue(error instanceof Error ? error.message : "Failed to add investment");
    }
  }
);

export const refreshStaleInvestments = createAsyncThunk(
  "investments/refreshStale",
  async (_, { getState, dispatch }) => {
    const state = (getState() as RootState).investments;
    const now = new Date();
    
    const investmentsToRefresh = state.investments.filter(investment => {
      if (investment.sellPrice !== null) return false; // Skip sold investments
      if (!investment.nextRefreshTime) return true;
      return new Date(investment.nextRefreshTime) <= now;
    });

    // Process investments in batches to avoid rate limiting
    const batchSize = API_CONFIG.maxConcurrentRefreshes;
    for (let i = 0; i < investmentsToRefresh.length; i += batchSize) {
      const batch = investmentsToRefresh.slice(i, i + batchSize);
      await Promise.all(batch.map(async (investment) => {
        try {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.backgroundRefreshDelay));
          
          const priceResult = await dispatch(
            fetchStockPrice({ 
              symbol: investment.symbol, 
              backgroundRefresh: true 
            })
          ).unwrap();
          
          dispatch(
            updateInvestmentValue({
              id: investment.id,
              price: priceResult.price,
              lastPriceUpdate: new Date().toISOString(),
              nextRefreshTime: calculateNextRefreshTime(),
            })
          );
        } catch (error) {
          console.error(`Failed to refresh ${investment.symbol}:`, error);
          const retryDelay = Math.min(
            API_CONFIG.priceRefreshIntervalMs / 4,
            API_CONFIG.retryDelayMs * Math.pow(2, investment.refreshAttempts || 1)
          );
          
          dispatch(
            updateInvestmentRefreshTime({
              id: investment.id,
              nextRefreshTime: new Date(Date.now() + retryDelay).toISOString(),
              refreshAttempts: (investment.refreshAttempts || 0) + 1,
            })
          );
        }
      }));
    }

    dispatch(setLastAutoRefresh(new Date().toISOString()));
    return investmentsToRefresh.length;
  }
);

export const startAutoRefresh = createAsyncThunk(
  "investments/startAutoRefresh",
  async (_, { dispatch }) => {
    // Initial delay before first refresh
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.backgroundRefreshInitialDelay));
    
    // Perform initial refresh
    await dispatch(refreshStaleInvestments());
    
    // Set up hourly refresh interval
    const intervalId = setInterval(async () => {
      try {
        await dispatch(refreshStaleInvestments());
      } catch (error) {
        console.error("Error during auto refresh:", error);
      }
    }, API_CONFIG.backgroundRefreshInterval);
    
    dispatch(setRefreshInterval(intervalId));
    return intervalId;
  }
);

export const stopAutoRefresh = createAsyncThunk(
  "investments/stopAutoRefresh",
  async (_, { getState }) => {
    const state = (getState() as RootState).investments;
    if (state.refreshIntervalId) {
      clearInterval(state.refreshIntervalId);
    }
  }
);

// Slice
const investmentSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    addInvestmentToState: (state, action: PayloadAction<Investment>) => {
      state.investments.push(action.payload);
    },
    updateInvestmentValue: (
      state,
      action: PayloadAction<{
        id: string;
        price: number;
        lastPriceUpdate: string;
        nextRefreshTime?: string;
      }>
    ) => {
      const { id, price, lastPriceUpdate, nextRefreshTime } = action.payload;
      const investment = state.investments.find((inv) => inv.id === id);
      if (investment) {
        investment.currentValue = price ;
        investment.lastPriceUpdate = lastPriceUpdate;
        investment.updatedAt = new Date().toISOString();
        if (nextRefreshTime) investment.nextRefreshTime = nextRefreshTime;
        investment.refreshAttempts = 0;
        
        const isIndianStock = investment.symbol.endsWith(".NS");
        const cacheKey = `${investment.symbol}-${isIndianStock ? "INR" : "USD"}`;
        state.priceCache[cacheKey] = {
          price,
          timestamp: Date.now(),
          currency: isIndianStock ? "INR" : "USD",
        };
      }
    },
    updateInvestmentRefreshTime: (
      state,
      action: PayloadAction<{
        id: string;
        nextRefreshTime: string;
        refreshAttempts?: number;
      }>
    ) => {
      const { id, nextRefreshTime, refreshAttempts } = action.payload;
      const investment = state.investments.find((inv) => inv.id === id);
      if (investment) {
        investment.nextRefreshTime = nextRefreshTime;
        investment.updatedAt = new Date().toISOString();
        if (refreshAttempts !== undefined) {
          investment.refreshAttempts = refreshAttempts;
        }
      }
    },
    setLastAutoRefresh: (state, action: PayloadAction<string>) => {
      state.lastAutoRefresh = action.payload;
    },
    setRefreshInterval: (state, action: PayloadAction<NodeJS.Timeout>) => {
      if (state.refreshIntervalId) clearInterval(state.refreshIntervalId);
      state.refreshIntervalId = action.payload;
    },
    markApiKeySuccess: (state, action: PayloadAction<{ key: string; index: number }>) => {
      const { key, index } = action.payload;
      state.apiKeys.status[key] = { valid: true, lastUsed: Date.now(), errorCount: 0 };
      state.apiKeys.lastSuccessfulKey = key;
      state.apiKeys.currentIndex = index;
    },
    markApiKeyFailure: (
      state,
      action: PayloadAction<{ key: string; cooldownMs: number; error?: string }>
    ) => {
      const { key, cooldownMs, error } = action.payload;
      const currentStatus = state.apiKeys.status[key] || { valid: true, lastUsed: 0, errorCount: 0 };
      state.apiKeys.status[key] = {
        valid: currentStatus.errorCount < API_CONFIG.maxErrorsBeforeDisable,
        lastUsed: Date.now(),
        errorCount: currentStatus.errorCount + 1,
        retryAfter: Date.now() + cooldownMs,
        lastError: error,
      };
    },
    resetApiKeys: (state) => {
      state.apiKeys.keys = getCurrentApiKeys();
      state.apiKeys.currentIndex = 0;
      state.apiKeys.lastSuccessfulKey = null;
      state.apiKeys.status = {};
    },
    cleanOldCache: (state) => {
      const now = Date.now();
      Object.keys(state.priceCache).forEach(key => {
        if (now - state.priceCache[key].timestamp > API_CONFIG.cacheExpiryMs) {
          delete state.priceCache[key];
        }
      });
    },
    clearInvestments: (state) => {
      if (state.refreshIntervalId) clearInterval(state.refreshIntervalId);
      return initialState;
    },
    setFilter: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
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
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStockPrice.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(addInvestments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addInvestments.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(addInvestments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(refreshStaleInvestments.fulfilled, (state, action) => {
        console.log(`Refreshed ${action.payload} investments`);
      })
      .addCase(startAutoRefresh.fulfilled, (state, action) => {
        console.log("Auto refresh process started");
        state.refreshIntervalId = action.payload;
      })
      .addCase(stopAutoRefresh.fulfilled, (state) => {
        state.refreshIntervalId = null;
      });
  },
});

// Export actions
export const {
  addInvestmentToState,
  updateInvestmentValue,
  updateInvestmentRefreshTime,
  setLastAutoRefresh,
  setRefreshInterval,
  markApiKeySuccess,
  markApiKeyFailure,
  resetApiKeys,
  updateSellPrice,
  clearInvestments,
  setFilter,
  cleanOldCache,
} = investmentSlice.actions;

export default investmentSlice.reducer;