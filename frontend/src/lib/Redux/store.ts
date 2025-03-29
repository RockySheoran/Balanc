/** @format */

// lib/store.ts
import { configureStore } from "@reduxjs/toolkit"
import userSlice  from "./features/user/userInfoSlice"
import {
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
import AllSlice from "./AllSlice"

const rootReducer = combineReducers({
  userInfo: userSlice,
})

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["userInfo"], // Explicitly persist userInfo
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
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
