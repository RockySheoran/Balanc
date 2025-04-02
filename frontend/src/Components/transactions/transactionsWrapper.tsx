/** @format */
"use client"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"


import { Button } from "@/Components/ui/button"
import { DownloadIcon } from "./Icons"
import TransactionStats from "./TransactionStats"
import TransactionCharts from "./TransactionCharts"

import TransactionTable from "./TransactionTable"
import { clearTransactions, setTransactions } from "@/lib/Redux/features/transactions/transactionsSlice"
import { useAppSelector } from "@/lib/Redux/store/hooks"

// Mock data - replace with actual API call
// const mockTransactions = [
//   {
//     id: "1",
//     date: "2023-01-01",
//     description: "Salary",
//     amount: 3000,
//     type: "CREDIT",
//     category: "Income",
//   },
//   {
//     id: "2",
//     date: "2023-01-02",
//     description: "Rent",
//     amount: -1000,
//     type: "EXPENSE",
//     category: "Housing",
//   },
//   // Add more transactions as needed
// ]

export default function TransactionsPage() {
  const dispatch = useDispatch()
  const { transactions } = useAppSelector((state) => state.transactions)

  useEffect(() => {
    // In a real app, you would fetch transactions from an API here
    // dispatch(setTransactions(mockTransactions))
  }, [dispatch])
  // dispatch(clearTransactions()) 

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your financial transactions
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
   
      {/* Stats Highlights */}
      <TransactionStats />

      {/* Charts Section */}
      <TransactionCharts />

   
      {/* Transactions Table */}
      <TransactionTable />
    </div>
  )
}
