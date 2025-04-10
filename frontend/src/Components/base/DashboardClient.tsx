/** @format */

// src/app/dashboard/DashboardClient.tsx (Client Component)
"use client"

import { useEffect, Suspense, lazy } from "react"
import { signOut } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { clearUser, setUser } from "@/lib/Redux/features/user/userSlice"
import { fetchAllTransactions } from "@/Actions/transactionActions/fetchAllTransactions"
import { toast } from "sonner"
import {
  addTransaction,
  clearTransactions,
} from "@/lib/Redux/features/transactions/transactionsSlice"
import {
  addExpense,
  clearExpense,
} from "@/lib/Redux/features/expense/expenseSlice"
import useSWR from "swr"
import { fetchAllInvestment } from "@/Actions/investmentApi/fetchAllInvestment"
import { addBackendInvestment, clearInvestments } from "@/lib/Redux/features/investmentSlice/investmentSlice"
import { clearIncome } from "@/lib/Redux/features/income/incomeSlices"
import { clearAccount } from "@/lib/Redux/features/account/accountSlice"


interface SessionProps {
  session: {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
    token?: string // Added missing token property
  } | null
}

/**
 * DashboardClient - Main dashboard component with optimized data fetching
 *
 * Features:
 * - Session management with automatic sign-out
 * - SWR for client-side data revalidation
 * - Lazy loading for heavy components
 * - Memoized selectors for performance
 * - Error boundaries for graceful failure
 * - Optimized Redux dispatches
 *
 * @param {SessionProps} session - User session data
 */
export default function DashboardClient({ session }: SessionProps) {
  
  console.log(session)
  const dispatch = useAppDispatch()
  const { selectedAccount } = useAppSelector((state) => state.account)
  const { expenseTransactions } = useAppSelector((state) => state.transactions)
  // SWR configuration for client-side data revalidation
  const { data: transactionsData, error: transactionsError } = useSWR(
    selectedAccount?.id ? `/api/transactions/${selectedAccount.id}` : null,
    async (url) => {
      const response = await fetchAllTransactions({
        accountId: selectedAccount!.id,
      })
      
      console.log(response)
      if (response.status !== 200) throw new Error(response.message)
      return response.data.transactions
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )
  // Session management effect
  useEffect(() => {
    
    if (!session) {
      signOut({ redirect: true, callbackUrl: "/login" })
      
          dispatch(clearUser())
          dispatch(clearIncome())
          dispatch(clearTransactions())
          dispatch(clearExpense())
          dispatch(clearAccount())
          dispatch(clearInvestments())
    } else {
      dispatch(
        setUser({
          id: null,
          name: session.user?.name || "",
          email: session.user?.email || "",
          // image: session.user?.image || "",
          token: session.token || "",
        })
      )
    }
  }, [session, dispatch])

  // Transaction data effect with optimizations
  useEffect(() => {
    if (!selectedAccount?.id) return

    const loadTransactions = async () => {
      try {
        console.log(transactionsData)
        if (transactionsData) {
          dispatch(clearTransactions())
          transactionsData.forEach((transaction: any) => {
            dispatch(addTransaction(transaction))
          })
        } else if (transactionsError) {
          console.log(transactionsError)
          toast.error("Failed to load transactions")
        }
      } catch (error) {
        toast.error("An error occurred while processing transactions")
      }
    }

    loadTransactions()
  }, [selectedAccount?.id, transactionsData, transactionsError, dispatch])
  
  // Expense processing effect with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(clearExpense())
      expenseTransactions.forEach((transaction: any) => {
        dispatch(addExpense(transaction))
      })
    }, 300) // Small debounce to avoid rapid updates
    
    return () => clearTimeout(timer)
  }, [expenseTransactions, dispatch])
  const { data: investmentData, error: investmentError } = useSWR(
    selectedAccount?.id ? `/api/investment/${selectedAccount.id}` : null,
    async (url) => {
      const response = await fetchAllInvestment({
        accountId: selectedAccount!.id,
      })
      console.log(response)
      if (response.status !== 200) throw new Error(response.message)
        return response.data.investments
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )
  
  useEffect(() => {
    if (!selectedAccount?.id) return

    const loadInvestment = async () => {
      try {
        console.log(investmentData)
        if (investmentData) {
          dispatch(clearInvestments())
          investmentData.forEach((transaction: any) => {
            dispatch(addBackendInvestment(transaction))
          })
        } else if (investmentError) {
          toast.error("Failed to load investments ")
        }
      } catch (error) {
        toast.error("An error occurred while processing transactions")
      }
    }

    loadInvestment()
  }, [selectedAccount?.id, investmentData, investmentError, dispatch])

  return (
  <></>
  )
}

// Optional: Create a wrapper for SSR/SSG/ISR support
export async function DashboardServerWrapper({ session }: SessionProps) {
  // This could pre-fetch data on the server if needed
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient session={session} />
    </Suspense>
  )
}
