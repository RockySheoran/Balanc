/** @format */
"use client"

import LoadingSpinner from "@/Components/expense/LoadingSpinner"
import { LoadingCard } from "@/Components/income/LoadingCard"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Suspense } from "react"


// Dynamic imports with individual Suspense boundaries
const IncomeStats = dynamic(() => import("@/Components/income/IncomeStats"), {
  loading: () => <LoadingCard height="h-32" />,
  ssr: false,
})
const IncomeCharts = dynamic(() => import("@/Components/income/IncomeCharts"), {
  loading: () => <LoadingCard height="h-80" />,
  ssr: false,
})
const IncomeFilters = dynamic(
  () => import("@/Components/income/IncomeFilters"),
  {
    loading: () => <LoadingCard height="h-40" />,
    ssr: false,
  }
)
const IncomeTable = dynamic(() => import("@/Components/income/IncomeTable"), {
  loading: () => <LoadingCard height="h-96" />,
  ssr: false,
})
const IncomePagination = dynamic(
  () => import("@/Components/income/IncomePagination"),
  {
    loading: () => <LoadingCard height="h-20" />,
    ssr: false,
  }
)
const AddIncomeForm = dynamic(
  () => import("@/Components/income/AddIncomeForm"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

const IncomeManagementPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl">
        {/* Header Section with its own Suspense */}
        <motion.div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-col md:flex-row justify-between items-center rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-4 md:mb-0">
            Income Management
          </h1>
          <div className="w-full md:w-auto">
            <Suspense fallback={<LoadingSpinner size="md" />}>
              <AddIncomeForm />
            </Suspense>
          </div>
        </motion.div>

        {/* Main Content with individual Suspense for each component */}
        <div className="space-y-6">
          <Suspense fallback={<LoadingCard height="h-32" />}>
            <IncomeStats />
          </Suspense>

          <Suspense fallback={<LoadingCard height="h-80" />}>
            <IncomeCharts />
          </Suspense>

          <Suspense fallback={<LoadingCard height="h-40" />}>
            <IncomeFilters />
          </Suspense>

          <Suspense fallback={<LoadingCard height="h-96" />}>
            <IncomeTable />
          </Suspense>

          <Suspense fallback={<LoadingCard height="h-20" />}>
            <IncomePagination />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}

export default IncomeManagementPage
