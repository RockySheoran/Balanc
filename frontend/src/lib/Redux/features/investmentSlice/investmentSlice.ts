/** @format */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../store/store";

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
  lastChecked: string;
  retryAfter: string;
}

interface InvestmentState {
  investments: Investment[];
  status: "idle" | "loading" | "succeeded" | "failed";
  filters: Filters;
  error: string | null;
  priceCache: Record<string, { price: number; timestamp: string }>;
  apiKeys: {
    keys: string[];
    currentIndex: number;
    status: Record<string, ApiKeyStatus>;
  };
}

// Constants
const STALE_PRICE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const API_RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;
const KEY_COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour cooldown for failed keys

// Helper function to safely load API keys
const loadApiKeys = () => {
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
        lastChecked: new Date(0).toISOString(),
        retryAfter: new Date(0).toISOString(),
      };
      return acc;
    }, {} as Record<string, ApiKeyStatus>),
  },
};

// Helper Functions
const isStale = (timestamp: string, thresholdMs: number) => {
  return Date.now() - new Date(timestamp).getTime() > thresholdMs;
};

const isKeyAvailable = (keyStatus: ApiKeyStatus) => {
  const now = new Date();
  return (
    keyStatus.valid ||
    isStale(keyStatus.retryAfter, KEY_COOLDOWN_DURATION_MS) ||
    new Date(keyStatus.retryAfter) < now
  );
};

const getNextValidKey = (state: InvestmentState) => {
  if (!state?.apiKeys?.keys || !state.apiKeys.status) {
    console.error("Invalid apiKeys structure in state:", state.apiKeys);
    return null;
  }

  const { keys, currentIndex, status } = state.apiKeys;
  const now = new Date();

  for (let i = 0; i < keys.length; i++) {
    const index = (currentIndex + i) % keys.length;
    const key = keys[index];
    const keyStatus = status[key];

    if (keyStatus && isKeyAvailable(keyStatus)) {
      return { key, index };
    }
  }

  return null;
};

// Thunks
export const fetchStockPrice = createAsyncThunk(
  "investments/fetchPrice",
  async (symbol: string, { getState, dispatch, rejectWithValue }) => {
    const state = (getState() as RootState).investment;

    if (!state?.apiKeys?.keys) {
      console.error("API keys not initialized. Current state:", state);
      dispatch(initializeApiKeys());
      return rejectWithValue("API keys not initialized");
    }

    const cleanSymbol = symbol.toUpperCase();
    const cachedPrice = state.priceCache[cleanSymbol];
    
    if (cachedPrice && !isStale(cachedPrice.timestamp, STALE_PRICE_THRESHOLD_MS)) {
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        fromCache: true,
      };
    }

    let retries = 0;
    let lastError: Error | null = null;

    while (retries < MAX_RETRIES) {
      const keyInfo = getNextValidKey(state);
      if (!keyInfo) {
        dispatch(resetApiKeys());
        return rejectWithValue("No valid API keys available");
      }

      const { key, index } = keyInfo;
      const isIndianStock = cleanSymbol.endsWith(".NS");

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
        if (typeof price !== "number") throw new Error("Invalid price data");

        dispatch(markApiKeySuccess(key));
        dispatch(rotateApiKey(index));

        return {
          symbol: cleanSymbol,
          price,
          fromCache: false,
          apiKeyIndex: index,
        };
      } catch (error) {
        lastError = error as Error;
        retries++;

        if (axios.isAxiosError(error)) {
          const cooldownMs = error.response?.status === 401 ? 
            KEY_COOLDOWN_DURATION_MS : 
            Math.min(parseInt(error.response?.headers['retry-after'] || "3600", 10) * 1000)
          
          dispatch(markApiKeyFailure({ key, cooldownMs }));
        }

        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY_MS));
      }
    }

    if (cachedPrice) {
      return {
        symbol: cleanSymbol,
        price: cachedPrice.price,
        fromCache: true,
        error: "Using stale cache after fetch failure",
      };
    }

    return rejectWithValue(lastError?.message || "Failed to fetch price");
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
        state.priceCache[investment.symbol] = {
          price,
          timestamp: new Date().toISOString(),
        };
      }
    },
    markApiKeySuccess: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (state.apiKeys.status[key]) {
        state.apiKeys.status[key] = {
          valid: true,
          lastChecked: new Date().toISOString(),
          retryAfter: new Date(0).toISOString(),
        };
      }
    },
    markApiKeyFailure: (
      state,
      action: PayloadAction<{ key: string; cooldownMs: number }>
    ) => {
      const { key, cooldownMs } = action.payload;
      if (state.apiKeys.status[key]) {
        const retryAfter = new Date(Date.now() + cooldownMs).toISOString();
        state.apiKeys.status[key] = {
          valid: false,
          lastChecked: new Date().toISOString(),
          retryAfter,
        };
      }
    },
    rotateApiKey: (state, action: PayloadAction<number>) => {
      if (state.apiKeys.keys.length > 1) {
        state.apiKeys.currentIndex = (action.payload + 1) % state.apiKeys.keys.length;
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
          lastChecked: new Date().toISOString(),
          retryAfter: new Date(0).toISOString(),
        };
      });
      state.apiKeys.currentIndex = 0;
    },
    initializeApiKeys: (state) => {
      if (!state.apiKeys || !state.apiKeys.keys) {
        state.apiKeys = {
          keys: API_KEYS,
          currentIndex: 0,
          status: API_KEYS.reduce((acc, key) => {
            acc[key] = {
              valid: true,
              lastChecked: new Date(0).toISOString(),
              retryAfter: new Date(0).toISOString(),
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
          state.priceCache[action.payload.symbol] = {
            price: action.payload.price,
            timestamp: new Date().toISOString(),
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