

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
  };
}

// Constants
const API_CONFIG = {
  stalePriceThresholdMs: 10 * 60 * 1000, // 10 minutes
  retryDelayMs: 1000,
  maxRetriesPerKey: 2,
  keyCooldownMs: 60 * 60 * 1000, // 1 hour
  maxErrorsBeforeDisable: 5,
  inrToUsdRate: 85,
};

// Helper to get fresh API keys from environment with validation
const getCurrentApiKeys = (): string[] => {
  try {
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
    ].filter((key): key is string => Boolean(key) && typeof key === 'string');

    if (keys.length === 0) {
      console.error("No valid API keys found in environment variables!");
      throw new Error("API configuration error - no valid keys found");
    }

    console.debug(`Loaded ${keys.length} valid API keys`);
    return keys;
  } catch (error) {
    console.error("Failed to load API keys:", error);
    return [];
  }
};

// Enhanced error logging
const logApiError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error)) {
    console.error(`API Error (${context}):`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      headers: error.config?.headers?.['X-RapidAPI-Key'] ? 
        {...error.config.headers, 'X-RapidAPI-Key': '***REDACTED***'} : 
        error.config?.headers,
    });
  } else if (error instanceof Error) {
    console.error(`Error (${context}):`, error.message, error.stack);
  } else {
    console.error(`Unknown error (${context}):`, error);
  }
};

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
    keys: [],
    currentIndex: 0,
    status: {},
  },
};

// Smart API key selection with fresh keys
const selectApiKey = (state: InvestmentState): { key: string; index: number } | null => {
  const currentKeys = getCurrentApiKeys();
  if (currentKeys.length === 0) {
    console.error("No API keys available for selection");
    return null;
  }

  // Merge current keys with existing status
  const keyStatus = currentKeys.reduce((acc, key) => {
    acc[key] = state.apiKeys.status[key] || {
      valid: true,
      lastUsed: 0,
      errorCount: 0,
    };
    return acc;
  }, {} as Record<string, ApiKeyStatus>);

  // Find best available key
  const availableKeys = currentKeys
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => {
      const status = keyStatus[key];
      const isAvailable = status.valid && 
        status.errorCount < API_CONFIG.maxErrorsBeforeDisable &&
        (!status.retryAfter || Date.now() > status.retryAfter);
      
      if (!isAvailable) {
        console.debug(`Key ${key.substring(0, 5)}... is not available`, status);
      }
      return isAvailable;
    })
    .sort((a, b) => {
      // Prefer keys with fewer errors and least recently used
      const aStatus = keyStatus[a.key];
      const bStatus = keyStatus[b.key];
      return aStatus.errorCount - bStatus.errorCount || 
             aStatus.lastUsed - bStatus.lastUsed;
    });

  if (availableKeys.length === 0) {
    console.error("No available API keys after filtering", {
      totalKeys: currentKeys.length,
      keyStatus: Object.keys(keyStatus).map(k => ({
        key: k.substring(0, 5) + '...',
        ...keyStatus[k]
      })),
    });
    return null;
  }

  const selectedKey = availableKeys[0];
  console.debug(`Selected API key: ${selectedKey.key.substring(0, 5)}...`, {
    index: selectedKey.index,
    errorCount: keyStatus[selectedKey.key].errorCount,
    lastUsed: keyStatus[selectedKey.key].lastUsed,
  });

  return selectedKey;
};

// Enhanced fetchStockPrice with detailed logging
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchPrice",
  async (symbol: string, { getState, dispatch, rejectWithValue }) => {
    const state = (getState() as RootState).investment;
    const cleanSymbol = symbol.toUpperCase();
    const isIndianStock = cleanSymbol.endsWith(".NS");
    const cacheKey = `${cleanSymbol}-${isIndianStock ? "INR" : "USD"}`;

    // Cache check with logging
    const cachedPrice = state.priceCache[cacheKey];
    if (cachedPrice && Date.now() - cachedPrice.timestamp < API_CONFIG.stalePriceThresholdMs) {
      console.debug(`Using cached price for ${cleanSymbol}`, {
        price: cachedPrice.price,
        age: Date.now() - cachedPrice.timestamp,
      });
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        currency: cachedPrice.currency,
        fromCache: true,
      };
    }

    let retries = 0;
    const maxAttempts = getCurrentApiKeys().length * API_CONFIG.maxRetriesPerKey;
    let lastError: Error | null = null;

    while (retries < maxAttempts) {
      const keyInfo = selectApiKey(state);
      if (!keyInfo) {
        const errorMsg = "No valid API keys available";
        console.error(errorMsg);
        return rejectWithValue(errorMsg);
      }

      const { key, index } = keyInfo;
      console.debug(`Attempt ${retries + 1} with key ${key.substring(0, 5)}...`);

      try {
        const startTime = Date.now();
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

        const responseTime = Date.now() - startTime;
        console.debug(`API call succeeded in ${responseTime}ms`, {
          symbol: cleanSymbol,
          key: key.substring(0, 5) + '...',
          responseTime,
        });

        const price = response.data?.quoteSummary?.result?.[0]?.price?.regularMarketPrice?.raw;
        if (typeof price !== "number") {
          throw new Error("Invalid price data in response");
        }

        const finalPrice = isIndianStock ? price / API_CONFIG.inrToUsdRate : price;
        const currency = isIndianStock ? "INR" : "USD";

        dispatch(markApiKeySuccess(key));
        
        return {
          symbol: cleanSymbol,
          price: parseFloat(finalPrice.toFixed(2)),
          currency,
          fromCache: false,
          apiKeyIndex: index,
        };
      } catch (error) {
        retries++;
        lastError = error as Error;
        logApiError(error, `fetchStockPrice(${cleanSymbol})`);

        if (axios.isAxiosError(error)) {
          const currentStatus = state.apiKeys.status[key] || {
            errorCount: 0,
            lastUsed: 0,
            valid: true,
          };
          const cooldownMs = calculateCooldown(error, currentStatus.errorCount);
          dispatch(markApiKeyFailure({ 
            key, 
            cooldownMs, 
            error: error.message 
          }));
        }

        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelayMs));
      }
    }

    // Fallback to stale cache if available
    if (cachedPrice) {
      console.warn(`Falling back to stale cache for ${cleanSymbol} after ${retries} attempts`, {
        lastError: lastError?.message,
        cacheAge: Date.now() - cachedPrice.timestamp,
      });
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        currency: cachedPrice.currency,
        fromCache: true,
        error: "Using stale cache after fetch failure",
      };
    }

    const errorMsg = lastError?.message || "Failed to fetch price after all retries";
    console.error(errorMsg, { attempts: retries });
    return rejectWithValue(errorMsg);
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

       if(newInvestment.sellPrice == null) {
          console.log("first time sell price is not null", newInvestment.sellPrice);
         const priceResult = await dispatch(
           fetchStockPrice(investmentData.symbol)
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
      console.error("Error adding investment:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add investment"
      );
    }
  }
);
// Slice with enhanced reducers
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
        
        const isIndianStock = investment.symbol.endsWith(".NS");
        const cacheKey = `${investment.symbol}-${isIndianStock ? "INR" : "USD"}`;
        state.priceCache[cacheKey] = {
          price,
          timestamp: Date.now(),
          currency: isIndianStock ? "INR" : "USD",
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

        // Update API key status to ensure proper rotation and retrieval
        const currentKey = state.apiKeys.keys[state.apiKeys.currentIndex];
        if (currentKey) {
          state.apiKeys.status[currentKey] = {
        ...state.apiKeys.status[currentKey],
        lastUsed: Date.now(),
          };
        }

        // Rotate to the next key for subsequent operations
        state.apiKeys.currentIndex = (state.apiKeys.currentIndex + 1) % state.apiKeys.keys.length;
      }
    },
    resetApiKeys: (state) => {
      Object.keys(state.apiKeys.status).forEach((key) => {
        state.apiKeys.status[key] = {
          valid: true,
          lastUsed: 0,
          errorCount: 0,
          retryAfter: undefined,
          lastError: undefined,
        };
      });
      state.apiKeys.currentIndex = 0;
    },
    markApiKeySuccess: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (!state.apiKeys.status[key]) {
        console.debug(`Initializing status for new API key: ${key.substring(0, 5)}...`);
      }
      state.apiKeys.status[key] = {
        valid: true,
        lastUsed: Date.now(),
        errorCount: 0,
        retryAfter: undefined,
        lastError: undefined,
      };
      console.debug(`Marked API key as successful: ${key.substring(0, 5)}...`);
    },
    markApiKeyFailure: (
      state,
      action: PayloadAction<{ key: string; cooldownMs: number; error?: string }>
    ) => {
      const { key, cooldownMs, error } = action.payload;
      const currentStatus = state.apiKeys.status[key] || {
        valid: true,
        lastUsed: 0,
        errorCount: 0,
      };
      
      const errorCount = currentStatus.errorCount + 1;
      const isValid = errorCount < API_CONFIG.maxErrorsBeforeDisable;
      
      state.apiKeys.status[key] = {
        valid: isValid,
        lastUsed: Date.now(),
        errorCount,
        retryAfter: Date.now() + cooldownMs,
        lastError: error,
      };
      
      console.warn(`Marked API key as failed: ${key.substring(0, 5)}...`, {
        errorCount,
        valid: isValid,
        retryAfter: cooldownMs,
        lastError: error,
      });
      
      if (!isValid) {
        console.error(`API key disabled due to too many errors: ${key.substring(0, 5)}...`);
      }
    },
    initializeApiKeys: (state) => {
      const keys = getCurrentApiKeys();
      if (keys.length > 0) {
        // Preserve existing status for keys that still exist
        const newStatus = keys.reduce((acc, key) => {
          acc[key] = state.apiKeys.status[key] || {
            valid: true,
            lastUsed: 0,
            errorCount: 0,
          };
          return acc;
        }, {} as Record<string, ApiKeyStatus>);

        state.apiKeys = {
          keys,
          currentIndex: 0,
          status: newStatus,
        };
        console.debug("Initialized API keys", { keyCount: keys.length });
      }
    },
    // ... (other reducers remain the same)
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockPrice.pending, (state) => {
        console.debug("Starting price fetch...");
        state.status = "loading";
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        console.debug("Price fetch succeeded", {
          symbol: action.payload.symbol,
          fromCache: action.payload.fromCache,
        });
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
        console.error("Price fetch failed", {
          error: action.payload,
        });
        state.status = "failed";
        state.error = (action.payload as string) || "Price fetch failed";
      });
  },
});

export const {
  addInvestmentToState,
  updateInvestmentValue,
  markApiKeySuccess,
  markApiKeyFailure,
  initializeApiKeys,
  rotateApiKey,
  updateSellPrice,
  clearInvestments,
  setFilter,
  resetApiKeys,
} = investmentSlice.actions;

export default investmentSlice.reducer;