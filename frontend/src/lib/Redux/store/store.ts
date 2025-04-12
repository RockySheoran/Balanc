/** @format */

// lib/store.ts
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
  storage: typeof window !== "undefined" ? storage : undefined,
  whitelist: ["user", "transactions"],
  timeout: 2000,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
