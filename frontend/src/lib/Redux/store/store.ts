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

// 1. Define root reducer
const rootReducer = combineReducers({
  user: userSlice,
  account: accountReducer,
  transaction: transactionSlice,
  expenses: expenseReducer,
  // Add other reducers here
})

// 2. Configure persistence
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  // whitelist: ["user"], // Only persist these reducers
  blacklist: ["temporaryData"], // Exclude from persistence
}

// 3. Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// 4. Configure store with DevTools
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV === "development",
})

// 5. Create persistor
export const persistor = persistStore(store)

// 6. TypeScript types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
