/** @format */

// src/app/dashboard/DashboardClient.tsx (Client Component)
"use client"

import { useEffect } from "react"

import { signOut } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { setUser } from "@/lib/Redux/features/user/userSlice"
import { fetchAllTransactions } from "@/Actions/transactionActions/fetchAllTransactions"
import { toast } from "sonner"
import { addTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"


interface SessionProps {
  session: {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  } | null
}

export default function DashboardClient({ session }: SessionProps) {
  const dispatch = useAppDispatch()
  // console.log(session.token)
  useEffect(() => {
    if (!session) {
      signOut({ redirect: true, callbackUrl: "/login" })
    } else {
      const data = {
        id: null, // Add a default value for id
        name: session.user?.name || "",
        email: session.user?.email || "",
        image: session.user?.image || "",
        token: session?.token || "",
      }
      //  console.log(data)
      dispatch(setUser(data))
    }
  }, [session, dispatch])

  const { selectedAccount } = useAppSelector((state: { account: { selectedAccount: { id: string } | null } }) => state.account)

  useEffect(() => {
    console.log(`object`)
    const allTransaction = async () => {
      // Skip if no account is selected
      if (!selectedAccount?.id) return

      // Optional: Check if transactions for this account already exist in Redux
    
        try {
          const AllTransactions = await fetchAllTransactions({
            accountId: selectedAccount.id,
          })
          if (AllTransactions.status === 200) {
            // Dispatch only if data is new
            AllTransactions.data.transactions.forEach((transaction :any) => {
              console.log(transaction)
              dispatch(addTransaction(transaction))
            })

          } else {
            toast.error(AllTransactions.message)
          }
        } catch (error) {
          toast.error("An error occurred while fetching transactions.")
        }
      }
    

    allTransaction()
  }, [selectedAccount?.id]) // Dependency only on selectedAccount.id

  return <></>
}
