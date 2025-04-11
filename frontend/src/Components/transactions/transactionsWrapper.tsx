/** @format */
"use client"

import { Suspense, lazy, memo, useCallback, useEffect } from "react"
import { useDispatch } from "react-redux"
import { Button } from "@/Components/ui/button"
import { DownloadIcon } from "./Icons"
import { clearTransactions } from "@/lib/Redux/features/transactions/transactionsSlice"
import LoadingSpinner from "./LoadingSpinner1"
import dynamic from "next/dynamic"
import { exportToExcel } from "@/lib/exportToExcel"
import { useAppSelector } from "@/lib/Redux/store/hooks"


// Lazy load components for better code splitting
const TransactionStats = dynamic(() => import("./TransactionStats"), { ssr: false })
const TransactionCharts = dynamic(() => import("./TransactionCharts"), { ssr: false })
const TransactionTable = dynamic(() => import("./TransactionTable"), { ssr: false })

const TransactionsPage = memo(() => {
  const dispatch = useDispatch()
  const { transactions } = useAppSelector((state) => state.transactions)
  const handleDownload = () => {
    exportToExcel(transactions, "Transaction_Report")
  }


  // Cleanup transactions when component unmounts
  const cleanup = useCallback(() => {
    dispatch(clearTransactions())
  }, [dispatch])

  // useEffect(() => {
  //   return () => {
  //     cleanup()
  //   }
  // }, [cleanup])

  return (
    <div className="w-full  mt-16 md:mt-0 p-4 md:p-6 space-y-6">
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
        <Button
          className="bg-primary cursor-pointer hover:bg-primary/90 text-white"
          onClick={handleDownload}
          aria-label="Download  transaction report">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Stats Highlights with Suspense */}
      <Suspense fallback={<LoadingSpinner className="h-32" />}>
        <TransactionStats />
      </Suspense>

      {/* Charts Section with Suspense */}
      <Suspense fallback={<LoadingSpinner className="h-96" />}>
        <TransactionCharts />
      </Suspense>

      {/* Transactions Table with Suspense */}
      <Suspense fallback={<LoadingSpinner className="h-96" />}>
        <TransactionTable />
      </Suspense>
    </div>
  )
})

TransactionsPage.displayName = "TransactionsPage"
export default TransactionsPage
