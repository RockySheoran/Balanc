/** @format */
"use client"

import { useEffect, Suspense, useCallback } from "react"
import { signOut } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { clearUser, setUser } from "@/lib/Redux/features/user/userSlice"
import { toast } from "sonner"
import useSWR from "swr"
import {
  addTransaction,
  clearTransactions,
} from "@/lib/Redux/features/transactions/transactionsSlice"
import {
  addExpense,
  clearExpense,
} from "@/lib/Redux/features/expense/expenseSlice"
import {
  addBackendInvestment,
  clearInvestments,
} from "@/lib/Redux/features/investmentSlice/investmentSlice"
import {
  addIncome,
  clearIncome,
} from "@/lib/Redux/features/income/incomeSlices"
import { clearAccount } from "@/lib/Redux/features/account/accountSlice"
import { fetchAllTransactions } from "@/Actions/transactionActions/fetchAllTransactions"
import { fetchAllInvestment } from "@/Actions/investmentApi/fetchAllInvestment"
import DashboardLoadingSkeleton from "@/Components/common/DashboardLoadingSkeleton"



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
  const { selectedAccount } = useAppSelector((state) => state.account)
  const { expenseTransactions, incomeTransactions } = useAppSelector(
    (state) => state.transactions
  )

  // Session management
  useEffect(() => {
    const handleSession = async () => {
      try {
        if (!session) {
          await signOut({ redirect: true, callbackUrl: "/login" })
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
              token: session.token || "",
            })
          )
        }
      } catch (error) {
        toast.error("Failed to manage user session")
        console.error("Session error:", error)
      }
    }

    handleSession()
  }, [session, dispatch])

  // Data fetching with error boundaries
  const fetchTransactions = useCallback(
    async (url: string) => {
      try {
        const response = await fetchAllTransactions({
          accountId: selectedAccount!.id,
        })

        if (response.status !== 200) {
          throw new Error(response.message || "Failed to fetch transactions")
        }
        return response.data.transactions
      } catch (error) {
        console.error("Transaction fetch error:", error)
        throw error
      }
    },
    [selectedAccount?.id]
  )

  const fetchInvestments = useCallback(
    async (url: string) => {
      try {
        const response = await fetchAllInvestment({
          accountId: selectedAccount!.id,
        })

        if (response.status !== 200) {
          throw new Error(response.message || "Failed to fetch investments")
        }
        return response.data.investments
      } catch (error) {
        console.error("Investment fetch error:", error)
        throw error
      }
    },
    [selectedAccount?.id]
  )

  // SWR hooks with error handling
  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useSWR(
    selectedAccount?.id ? `/api/transactions/${selectedAccount.id}` : null,
    fetchTransactions,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const {
    data: investmentData,
    error: investmentError,
    isLoading: investmentLoading,
  } = useSWR(
    selectedAccount?.id ? `/api/investment/${selectedAccount.id}` : null,
    fetchInvestments,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  // Process data with error boundaries
  useEffect(() => {
    const processTransactions = () => {
      try {
        if (transactionsData) {
          dispatch(clearTransactions())
          transactionsData.forEach((transaction: any) => {
            dispatch(addTransaction(transaction))
          })
        }
      } catch (error) {
        toast.error("Failed to process transactions")
        console.error("Transaction processing error:", error)
      }
    }

    processTransactions()
  }, [transactionsData, dispatch])

  useEffect(() => {
    const processInvestments = () => {
      try {
        if (investmentData) {
          dispatch(clearInvestments())
          investmentData.forEach((investment: any) => {
            dispatch(addBackendInvestment(investment))
          })
        }
      } catch (error) {
        toast.error("Failed to process investments")
        console.error("Investment processing error:", error)
      }
    }

    processInvestments()
  }, [investmentData, dispatch])

  // Debounced expense/income processing
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        dispatch(clearExpense())
        expenseTransactions.forEach((transaction: any) => {
          dispatch(addExpense(transaction))
        })
      } catch (error) {
        toast.error("Failed to process expenses")
        console.error("Expense processing error:", error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [expenseTransactions, dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        dispatch(clearIncome())
        incomeTransactions?.forEach((transaction: any) => {
          dispatch(addIncome(transaction))
        })
      } catch (error) {
        toast.error("Failed to process income")
        console.error("Income processing error:", error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [incomeTransactions, dispatch])

  // Loading state
  if (transactionsLoading || investmentLoading) {
    return <DashboardLoadingSkeleton />
  }

 
}

// Helper function for server-side rendering
export async function DashboardServerWrapper({ session }: SessionProps) {
  return (

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardClient session={session} />
      </Suspense>
   
  )
}
