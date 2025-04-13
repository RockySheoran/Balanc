/** @format */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Account, AccountState } from "./account"

const initialState: AccountState = {
  allAccounts: [],
  selectedAccount: null,
  isLoading: false,
  error: null,
}

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    // Set all accounts
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.allAccounts = action.payload
      state.isLoading = false
      state.error = null
    },

    // Select single account by ID
    selectAccount: (state, action: PayloadAction<string>) => {
      const account = state.allAccounts?.find((acc) => acc.id === action.payload)
      state.selectedAccount = account || null
    },

    // Add new account
    addAccount: (state, action: PayloadAction<Account>) => {
      state?.allAccounts?.push(action.payload)
    },

    // Update account
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.allAccounts?.findIndex(
        (acc) => acc.id === action.payload.id
      )
      if (index !== -1) {
        state.allAccounts[index] = action.payload
      }
      if (state.selectedAccount?.id === action.payload.id) {
        state.selectedAccount = action.payload
      }
    },

    // Delete account
    deleteAccount: (state, action: PayloadAction<string>) => {
      state.allAccounts = state.allAccounts?.filter(
        (acc) => acc.id !== action.payload
      )
      if (state.selectedAccount?.id === action.payload) {
        state.selectedAccount = null
      }
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },

    // Reset selected account
    resetSelectedAccount: (state) => {
      state.selectedAccount = null
    },
    clearAccount : () => initialState

  },
})

// Action creators
export const {
  setAccounts,
  selectAccount,
  addAccount,
  clearAccount,
  updateAccount,
  deleteAccount,
  setLoading,
  setError,
  resetSelectedAccount,
} = accountSlice.actions

export default accountSlice.reducer
