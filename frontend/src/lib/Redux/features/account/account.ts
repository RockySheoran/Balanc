/** @format */

export type AccountType =
  | "SAVINGS"
  | "CHECKING"
  | "CREDIT"
  | "INVESTMENT"
  | "LOAN"

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  income: number
  totalExpense: number
  createdAt: Date | string
}

// Redux state for accounts
export interface AccountState {
  allAccounts: Account[]
  selectedAccount: Account | null
  previousedAccount: Account | null
  isLoading: boolean
  error: string | null
}

// API response for multiple accounts
export interface AccountsResponse {
  success: boolean
  data: Account[]
  message?: string
}

// API response for a single account
export interface AccountResponse {
  success: boolean
  data: Account
  message?: string
}
