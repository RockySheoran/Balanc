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
  buyDate: string;
  sellDate: string | null;
  buyPrice: number;
  sellPrice: number | null;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
  lastPriceUpdate?: string;
}

interface ApiKeyStatus {
  valid: boolean;
  lastUsed: number;
  errorCount: number;
  retryAfter?: number;
}

interface CachedPrice {
  price: number;
  timestamp: number;
  currency: "USD" | "INR";
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
  };
}

// Constants
const STALE_PRICE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const API_RETRY_DELAY_MS = 1000;
const MAX_RETRIES_PER_KEY = 2;
const KEY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown for failed keys
const MAX_ERRORS_BEFORE_DISABLE = 5;
const INR_TO_USD_RATE = 85; // Example conversion rate

// Helper function to safely load API keys
const loadApiKeys = (): string[] => {
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
  ].filter(Boolean) as string[];

  if (keys.length === 0 && typeof window !== 'undefined') {
    console.error("No API keys found in environment variables!");
  }

  return keys;
};

const API_KEYS = loadApiKeys();

// Initial State
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
    keys: API_KEYS,
    currentIndex: 0,
    status: API_KEYS.reduce((acc, key) => {
      acc[key] = {
        valid: true,
        lastUsed: 0,
        errorCount: 0,
      };
      return acc;
    }, {} as Record<string, ApiKeyStatus>),
  },
};

// Helper Functions
const isStale = (timestamp: number, thresholdMs: number): boolean => {
  return Date.now() - timestamp > thresholdMs;
};

const getNextValidKey = (state: InvestmentState): { key: string; index: number } | null => {
  const { keys, currentIndex, status } = state.apiKeys;
  
  // Sort keys by least recently used and error count
  const sortedKeys = [...keys]
    .map((key, index) => ({ key, index }))
    .sort((a, b) => {
      const aStatus = status[a.key] || { errorCount: 0, lastUsed: 0 };
      const bStatus = status[b.key] || { errorCount: 0, lastUsed: 0 };
      
      // First sort by error count
      if (aStatus.errorCount !== bStatus.errorCount) {
        return aStatus.errorCount - bStatus.errorCount;
      }
      
      // Then by last used time
      return aStatus.lastUsed - bStatus.lastUsed;
    });

  for (const { key, index } of sortedKeys) {
    const keyStatus = status[key];
    
    if (!keyStatus) continue;
    
    // Skip if key is marked invalid
    if (!keyStatus.valid) continue;
    
    // Skip if key is in cooldown
    if (keyStatus.retryAfter && Date.now() < keyStatus.retryAfter) continue;
    
    // Skip if key has too many errors
    if (keyStatus.errorCount >= MAX_ERRORS_BEFORE_DISABLE) continue;
    
    return { key, index };
  }

  return null;
};

const calculateCooldown = (error: AxiosError, currentErrorCount: number): number => {
  if (error.response?.status === 429) {
    // Rate limited - use Retry-After header with exponential backoff
    const retryAfter = parseInt(error.response.headers['retry-after'] || "1", 10) * 1000;
    return Math.min(retryAfter * (2 ** currentErrorCount), KEY_COOLDOWN_MS);
  }
  
  if (error.response?.status === 401) {
    // Unauthorized - long cooldown
    return KEY_COOLDOWN_MS;
  }
  
  // Default exponential backoff
  return Math.min(1000 * (2 ** currentErrorCount), KEY_COOLDOWN_MS);
};

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchPrice",
  async (symbol: string, { getState, dispatch, rejectWithValue }) => {
    const state = (getState() as RootState).investment;
    const cleanSymbol = symbol.toUpperCase();
    const isIndianStock = cleanSymbol.endsWith(".NS");
    const cacheKey = `${cleanSymbol}-${isIndianStock ? "INR" : "USD"}`;
    
    // Check cache first
    const cachedPrice = state.priceCache[cacheKey];
    if (cachedPrice && !isStale(cachedPrice.timestamp, STALE_PRICE_THRESHOLD_MS)) {
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        currency: cachedPrice.currency,
        fromCache: true,
      };
    }

    let retries = 0;
    let lastError: Error | null = null;

    while (retries < state.apiKeys.keys.length * MAX_RETRIES_PER_KEY) {
      const keyInfo = getNextValidKey(state);
      if (!keyInfo) {
        return rejectWithValue("No valid API keys available");
      }

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
        if (typeof price !== "number") {
          throw new Error("Invalid price data in response");
        }

        // Convert to USD if Indian stock
        const finalPrice = isIndianStock ? price / INR_TO_USD_RATE : price;
        const currency = isIndianStock ? "INR" : "USD";

        // Update key status
        dispatch(markApiKeySuccess(key));
        
        return {
          symbol: cleanSymbol,
          price: parseFloat(finalPrice.toFixed(2)),
          currency,
          fromCache: false,
          apiKeyIndex: index,
        };
      } catch (error) {
        lastError = error as Error;
        retries++;

        if (axios.isAxiosError(error)) {
          const cooldownMs = calculateCooldown(error, state.apiKeys.status[key]?.errorCount || 0);
          dispatch(markApiKeyFailure({ key, cooldownMs }));
        }

        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_MS));
      }
    }

    // Fallback to stale cache if available
    if (cachedPrice) {
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        currency: cachedPrice.currency,
        fromCache: true,
        error: "Using stale cache after fetch failure",
      };
    }

    return rejectWithValue(lastError?.message || "Failed to fetch price after all retries");
  }
);

export const addInvestment = createAsyncThunk(
  "investments/add",
  async (
    investmentData: Omit<Investment, "lastPriceUpdate">,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const newInvestment: Investment = {
        ...investmentData,
        lastPriceUpdate: new Date().toISOString(),
      };

      dispatch(addInvestmentToState(newInvestment));

      const priceResult = await dispatch(
        fetchStockPrice(investmentData.symbol)
      ).unwrap();
console.log(priceResult)
      dispatch(
        updateInvestmentValue({
          id: newInvestment.id,
          price: priceResult.price,
          lastPriceUpdate: new Date().toISOString(),
        })
      );

      return newInvestment;
    } catch (error) {
      console.error("Error adding investment:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add investment"
      );
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
      state.status = "succeeded";
    },
    updateInvestmentValue: (
      state,
      action: PayloadAction<{
        id: string;
        price: number;
        lastPriceUpdate: string;
      }>
    ) => {
      const { id, price, lastPriceUpdate } = action.payload;
      const investment = state.investments.find((inv) => inv.id === id);
      if (investment) {
        investment.currentValue = price;
        investment.lastPriceUpdate = lastPriceUpdate;
        
        // Update cache
        const isIndianStock = investment.symbol.endsWith(".NS");
        const cacheKey = `${investment.symbol}-${isIndianStock ? "INR" : "USD"}`;
        state.priceCache[cacheKey] = {
          price,
          timestamp: Date.now(),
          currency: isIndianStock ? "INR" : "USD",
        };
      }
    },
    markApiKeySuccess: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (state.apiKeys.status[key]) {
        state.apiKeys.status[key] = {
          valid: true,
          lastUsed: Date.now(),
          errorCount: 0,
        };
      }
    },
    markApiKeyFailure: (
      state,
      action: PayloadAction<{ key: string; cooldownMs: number }>
    ) => {
      const { key, cooldownMs } = action.payload;
      if (state.apiKeys.status[key]) {
        const currentStatus = state.apiKeys.status[key];
        const errorCount = currentStatus.errorCount + 1;
        
        state.apiKeys.status[key] = {
          valid: errorCount < MAX_ERRORS_BEFORE_DISABLE,
          lastUsed: Date.now(),
          errorCount,
          retryAfter: Date.now() + cooldownMs,
        };
      }
    },
    rotateApiKey: (state) => {
      if (state.apiKeys.keys.length > 0) {
        state.apiKeys.currentIndex = (state.apiKeys.currentIndex + 1) % state.apiKeys.keys.length;
      }
    },
    clearInvestments: (state) => {
      state.investments = [];
      state.status = "idle";
      state.error = null;
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
    resetApiKeys: (state) => {
      Object.keys(state.apiKeys.status).forEach((key) => {
        state.apiKeys.status[key] = {
          valid: true,
          lastUsed: 0,
          errorCount: 0,
        };
      });
      state.apiKeys.currentIndex = 0;
    },
    initializeApiKeys: (state) => {
      if (!state.apiKeys || !state.apiKeys.keys || state.apiKeys.keys.length === 0) {
        const keys = loadApiKeys();
        state.apiKeys = {
          keys,
          currentIndex: 0,
          status: keys.reduce((acc, key) => {
            acc[key] = {
              valid: true,
              lastUsed: 0,
              errorCount: 0,
            };
            return acc;
          }, {} as Record<string, ApiKeyStatus>),
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (!action.payload.fromCache) {
          const cacheKey = `${action.payload.symbol}-${action.payload.currency}`;
          state.priceCache[cacheKey] = {
            price: action.payload.price,
            timestamp: Date.now(),
            currency: action.payload.currency as "USD" | "INR",
          };
        }
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Price fetch failed";
      })
      .addCase(addInvestment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addInvestment.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(addInvestment.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to add investment";
      });
  },
});

export const {
  addInvestmentToState,
  updateInvestmentValue,
  markApiKeySuccess,
  markApiKeyFailure,
  rotateApiKey,
  updateSellPrice,
  clearInvestments,
  setFilter,
  resetApiKeys,
  initializeApiKeys,
} = investmentSlice.actions;

export default investmentSlice.reducer;