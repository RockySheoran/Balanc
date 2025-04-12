/** @format */

import { configureStore } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage"
import { combineReducers } from "redux"
import userSlice from "../features/user/userSlice"
import accountReducer from "../features/account/accountSlice"
import transactionSlice from "../features/transactions/transactionsSlice"
import expenseReducer from "../features/expense/expenseSlice"
import incomeReducer from "../features/income/incomeSlices"
import investmentReducer from "../features/investmentSlice/investmentSlice"

// 1. Define root reducer
const rootReducer = combineReducers({
  user: userSlice,
  account: accountReducer,
  transactions: transactionSlice,
  expenses: expenseReducer,
  income: incomeReducer,
  investment: investmentReducer,
})

// 2. Configure persistence for ALL reducers
const persistConfig = {
  key: "root",
  version: 1,
  storage: typeof window !== "undefined" ? storage : undefined,
  // Remove whitelist to persist all reducers
  // Add debounce to prevent frequent saves
  debounce: 300,
  // Optional: Add transforms if you need to filter/serialize data
  // transforms: [yourTransforms]
}

// 3. Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// 4. Configure store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      // Keep immutable check for performance
      immutableCheck: process.env.NODE_ENV === "development",
    }),
  devTools: process.env.NODE_ENV === "development",
})

// 5. Create persistor with purge option
export const persistor = persistStore(store)

// Optional: Add function to purge persisted state
export const purgePersistedState = async () => {
  await persistor.purge()
}

// 6. TypeScript types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
