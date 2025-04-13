/** @format */
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import {
  setSortConfig,
  setCurrentPage,
  setTypeFilter,
  setTimeFilter,
} from "@/lib/Redux/features/transactions/transactionsSlice"
import { ArrowUpDownIcon, ChevronDownIcon, DownloadIcon } from "./Icons"
import { Button } from "@/Components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useMemo, useState, useCallback, memo } from "react"
import { ErrorBoundary } from "react-error-boundary"
import LoadingSpinner from "./LoadingSpinner"

// Constants moved outside component to prevent recreation on every render
const COLORS = {
  CREDIT: "#10B981",
  DEBIT: "#3B82F6",
  TRANSFER: "#8B5CF6",
  EXPENSE: "#EF4444",
  INCOME: "#10B981",
  INVESTMENT: "#F59E0B",
  CASH: "#6B7280",
} as const

const timeFilters = [
  { value: "all", label: "All Time" },
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
] as const

const transactionTypes = [
  { value: "all", label: "All Types" },
  { value: "CREDIT", label: "Credits" },
  { value: "DEBIT", label: "Debits" },
  { value: "TRANSFER", label: "Transfers" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "INVESTMENT", label: "Investments" },
] as const

type TransactionType = keyof typeof COLORS
type SortDirection = "asc" | "desc"
type SortableField = "date" | "amount" | "type"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  category: string
}

// Memoized TransactionRow component to prevent unnecessary re-renders
const TransactionRow = memo(({ transaction }: { transaction: Transaction }) => {
  const isPositive =
    transaction.type === "CREDIT" || transaction.type === "INCOME"
  const color = COLORS[transaction.type]

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {transaction.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {transaction.description}
      </td>
      <td
        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
          isPositive ? "text-emerald-500" : "text-red-500"
        }`}>
        {isPositive ? "+" : "-"}
        {transaction.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-all duration-200"
          style={{
            color,
            backgroundColor: `${color}20`,
          }}>
          {transaction.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {transaction.category}
      </td>
    </motion.tr>
  )
})

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 text-red-500">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
  </div>
)

const SortIndicator = memo(
  ({
    sortKey,
    sortConfig,
  }: {
    sortKey: SortableField
    sortConfig: { key: string; direction: string } | null
  }) => {
    if (!sortConfig || sortConfig.key !== sortKey) {
      return <ArrowUpDownIcon className="ml-1 h-3 w-3 opacity-30" />
    }
    return (
      <ArrowUpDownIcon
        className={`ml-1 h-3 w-3 ${
          sortConfig.direction === "asc" ? "transform rotate-180" : ""
        }`}
      />
    )
  }
)

const TransactionTableContent = () => {
  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state.transactions)

  const {
    filteredTransactions = [],
    filters = {
      timeFilter: "month",
      typeFilter: "all",
      sortConfig: { key: "date", direction: "desc" },
    },
    pagination = {
      currentPage: 1,
      transactionsPerPage: 10,
    },
  } = state

  const { sortConfig, timeFilter, typeFilter } = filters
  const { currentPage, transactionsPerPage } = pagination

  // Memoized calculations
  const totalPages = useMemo(
    () => Math.ceil(filteredTransactions.length / transactionsPerPage),
    [filteredTransactions.length, transactionsPerPage]
  )

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * transactionsPerPage
    const indexOfFirstItem = indexOfLastItem - transactionsPerPage
    return filteredTransactions.slice(indexOfFirstItem, indexOfLastItem)
  }, [currentPage, transactionsPerPage, filteredTransactions])

  // Memoized handlers
  const handleSort = useCallback(
    (key: SortableField) => {
      const direction: SortDirection =
        sortConfig?.key === key && sortConfig?.direction === "asc"
          ? "desc"
          : "asc"
      dispatch(setSortConfig({ key, direction }))
    },
    [dispatch, sortConfig]
  )

  const handleTimeFilterChange = useCallback(
    (value: string) => {
      dispatch(setTimeFilter(value))
      dispatch(setCurrentPage(1))
    },
    [dispatch]
  )

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      dispatch(setTypeFilter(value))
      dispatch(setCurrentPage(1))
    },
    [dispatch]
  )

  const goToPage = useCallback(
    (page: number) => {
      dispatch(setCurrentPage(page))
    },
    [dispatch]
  )

  const nextPage = useCallback(() => {
    dispatch(setCurrentPage(Math.min(currentPage + 1, totalPages)))
  }, [dispatch, currentPage, totalPages])

  const prevPage = useCallback(() => {
    dispatch(setCurrentPage(Math.max(currentPage - 1, 1)))
  }, [dispatch, currentPage])

  // Initial setup
  useEffect(() => {
    if (!state.filters) {
      dispatch(setTimeFilter("month"))
      dispatch(setTypeFilter("all"))
      dispatch(setSortConfig({ key: "date", direction: "desc" }))
    }
  }, [dispatch, state.filters])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Filter Controls - simplified JSX */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <select
            value={timeFilter || "month"}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
            className="px-3 py-2 cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200">
            {timeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter || "all"}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="px-3 py-2 cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200">
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

      
      </div>

      {/* Table - simplified with less inline styles */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader
                field="date"
                label="Date"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <SortableHeader
                field="amount"
                label="Amount"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader
                field="type"
                label="Type"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {currentItems.length > 0 ? (
                currentItems.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500">
                    No transactions found
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination - extracted to separate component would be better */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={transactionsPerPage}
          onPageChange={goToPage}
          onNext={nextPage}
          onPrev={prevPage}
        />
      )}
    </motion.div>
  )
}

const TransactionTable = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <TransactionTableContent />
      )}
    </ErrorBoundary>
  )
}

// Extracted components for better readability and performance
const SortableHeader = memo(
  ({
    field,
    label,
    sortConfig,
    onSort,
  }: {
    field: SortableField
    label: string
    sortConfig: { key: string; direction: string } | null
    onSort: (key: SortableField) => void
  }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
      onClick={() => onSort(field)}>
      <div className="flex items-center">
        {label}
        <SortIndicator sortKey={field} sortConfig={sortConfig} />
      </div>
    </th>
  )
)

const PaginationControls = memo(
  ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onNext,
    onPrev,
  }: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onNext: () => void
    onPrev: () => void
  }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          onClick={onPrev}
          disabled={currentPage === 1}
          variant="outline"
          className="border-gray-300 dark:border-gray-600">
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={currentPage === totalPages}
          variant="outline"
          className="ml-3 border-gray-300 dark:border-gray-600">
          Next
        </Button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <Button
              onClick={onPrev}
              disabled={currentPage === 1}
              variant="outline"
              size="icon"
              className="rounded-r-none border-gray-300 dark:border-gray-600">
              <ChevronDownIcon className="h-4 w-4 transform rotate-90" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? "default" : "outline"}
                className={`rounded-none ${
                  currentPage === page
                    ? ""
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                {page}
              </Button>
            ))}
            <Button
              onClick={onNext}
              disabled={currentPage === totalPages}
              variant="outline"
              size="icon"
              className="rounded-l-none border-gray-300 dark:border-gray-600">
              <ChevronDownIcon className="h-4 w-4 transform -rotate-90" />
            </Button>
          </nav>
        </div>
      </div>
    </motion.div>
  )
)

export default TransactionTable
