/** @format */

// src/app/dashboard/DashboardClient.tsx
"use client"

import { useEffect, Suspense } from "react"
import { signOut } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { clearUser, setUser } from "@/lib/Redux/features/user/userSlice"
import {
  addTransaction,
  clearTransactions,
} from "@/lib/Redux/features/transactions/transactionsSlice"
import {
  addExpense,
  clearExpense,
} from "@/lib/Redux/features/expense/expenseSlice"
import {
  addIncome,
  clearIncome,
} from "@/lib/Redux/features/income/incomeSlices"
import {
  clearAccount,
  selectAccount,
  setAccounts,
} from "@/lib/Redux/features/account/accountSlice"
import {
  addBackendInvestment,
  addInvestment,
  clearInvestments,
} from "@/lib/Redux/features/investmentSlice/investmentSlice"

import { fetchAllTransactions } from "@/Actions/transactionActions/fetchAllTransactions"
import { fetchAllInvestment } from "@/Actions/investmentApi/fetchAllInvestment"
import { getAllAccounts } from "@/Actions/AccountActions/getAllAccount"

import { toast } from "sonner"
import useSWR from "swr"

interface SessionProps {
  session: {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
    token?: string
  } | null
}

export default function DashboardClient({ session }: SessionProps) {
  const dispatch = useAppDispatch()
  const { allAccounts, selectedAccount } = useAppSelector(
    (state) => state.account
  )
  const { expenseTransactions, incomeTransactions } = useAppSelector(
    (state) => state.transactions
  )

  // Fetch accounts
  const { isLoading: isAccountsLoading } = useSWR(
    session?.token ? "accounts" : null,
    async () => {
      const response = await getAllAccounts({ token: session?.token || "" })
      if (response?.status == 404 || !response?.data) {
        toast.error(response?.message || "Failed to fetch accounts")
        return null
      }
      return response.data
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        if(!data) return
        dispatch(setAccounts(data))
        if (!selectedAccount && data?.length > 0) {
          dispatch(selectAccount(data[0].id))
        }
        toast.success("Accounts loaded successfully")
      },
      onError: (err) => toast.error(err.message),
    }
  )

  // Fetch transactions
  const { data: transactionsData, error: transactionsError } = useSWR(
    selectedAccount?.id ? `/api/transactions/${selectedAccount.id}` : null,
    async () => {
     
      const response = await fetchAllTransactions({
        accountId: selectedAccount!.id,
      })
        if (response?.status == 404 || !response?.data) {
          toast.error(response?.message || "Failed to fetch transactions")  
          return null
        }
      return response.data
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        // console.log(data)
         if(!data) return
        if (data?.transactions) {
          dispatch(clearTransactions())
          data?.transactions?.forEach((transaction: any) => {
            dispatch(addTransaction(transaction))
          })
          toast.success("Transactions loaded successfully")
        } else {
          toast.error("No transactions found")
        }
      },
      onError: (err) => toast.error(err.message),
    }
  )

  // Fetch investments
  const { data: investmentData, error: investmentError } = useSWR(
    selectedAccount?.id ? `/api/investment/${selectedAccount.id}` : null,
    async () => {
      const response = await fetchAllInvestment({
        accountId: selectedAccount!.id,
      })
         if (response?.status == 404 || !response?.data) {
           toast.error(response?.message || "Failed to fetch investment")
           return null
         }
      return response.data.investments
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
         if (!data) return
        dispatch(clearInvestments())
        data.forEach((inv: any) => {
          dispatch(addBackendInvestment(inv))
          // dispatch(addInvestment(inv))
        })
        toast.success("Investments loaded successfully")
      },
      onError: (err) => toast.error("Failed to load investments"),
    }
  )

  // Session effect
  useEffect(() => {
    if (!session) {
      dispatch(clearUser())
      dispatch(clearIncome())
      dispatch(clearTransactions())
      dispatch(clearExpense())
      dispatch(clearAccount())
      dispatch(clearInvestments())
      signOut({ redirect: true, callbackUrl: "/login" })
    } else {
      dispatch(
        setUser({
          id: null,
          name: session.user?.name || "",
          email: session.user?.email || "",
          token: session.token || "",
        })
      )
    }
  }, [session, dispatch])

  // Debounce expenses update
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(clearExpense())
      expenseTransactions.forEach((transaction: any) => {
        dispatch(addExpense(transaction))
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [expenseTransactions, dispatch])

  // Debounce income update
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(clearIncome())
      incomeTransactions?.forEach((transaction: any) => {
        dispatch(addIncome(transaction))
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [incomeTransactions, dispatch])

  return null
}

// Wrapper for Suspense support
export function DashboardServerWrapper({ session }: SessionProps) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient session={session} />
    </Suspense>
  )
}
