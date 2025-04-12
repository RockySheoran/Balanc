/** @format */

// lib/Redux/store/store.ts
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
import storage from "./storage" // Use our custom storage
import { combineReducers } from "redux"
import userSlice from "../features/user/userSlice"
import accountReducer from "../features/account/accountSlice"
import transactionSlice from "../features/transactions/transactionsSlice"
import expenseReducer from "../features/expense/expenseSlice"
import incomeReducer from "../features/income/incomeSlices"
import investmentReducer from "../features/investmentSlice/investmentSlice"

const rootReducer = combineReducers({
  user: userSlice,
  account: accountReducer,
  transactions: transactionSlice,
  expenses: expenseReducer,
  income: incomeReducer,
  investment: investmentReducer,
})

const persistConfig = {
  key: "root",
  version: 1,
  storage, // Use our custom storage
  whitelist: ["user", "transactions"],
  timeout: 2000,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
