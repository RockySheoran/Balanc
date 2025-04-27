/** @format */
"use client"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { debounce } from "lodash"
import {
  FiPlus,
  FiSearch,
  FiTrendingUp,
  FiAward,
  FiPieChart,
} from "react-icons/fi"
import { RiArrowUpDownLine } from "react-icons/ri"

// Redux
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import {
  addInvestment,
  fetchStockPrice,
  
  setFilter,
} from "@/lib/Redux/features/investmentSlice/investmentSlice"

import type { RootState } from "@/lib/Redux/store/store"
import SkeletonLoader from "./SkeletonLoader"
import { Investment } from "./investment"

// Components
const SummaryCards = dynamic(() => import("./SummaryCards"), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonLoader key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  ),
})

const PerformanceChart = dynamic(() => import("./PerformanceChart"), {
  ssr: false,
  loading: () => <SkeletonLoader className="h-80 w-full rounded-xl" />,
})

const TopPerformers = dynamic(() => import("./TopPerformers"), {
  ssr: false,
  loading: () => <SkeletonLoader className="h-80 w-full rounded-xl" />,
})

const InvestmentTable = dynamic(
  () => import("./InvestmentTable").then((mod) => mod.InvestmentTable),
  {
    ssr: false,
    loading: () => <SkeletonLoader className="h-64 w-full rounded-xl" />,
  }
)

const InvestmentForm = dynamic(() => import("./InvestmentForm"))

// Types
type Filters = {
  searchTerm: string
  dateRange: "all" | "1m" | "3m" | "6m" | "1y"
  performanceFilter: "all" | "profit" | "loss" | "best" |"sold"
}

const InvestmentManagement = () => {
  const dispatch = useAppDispatch()
  const { investments, status, filters } = useAppSelector(
    (state: RootState) => state.investment
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Memoized filtered investments
  const filteredInvestments = useMemo(() => {
    if (!investments) return []

    return investments.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        inv.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase())

      switch (filters.performanceFilter) {
        case "profit":
          return (
            matchesSearch &&
            (inv.currentValue ? inv.currentValue > inv.buyPrice : false)
          )
        case "loss":
          return (
            matchesSearch &&
            (inv.currentValue ? inv.currentValue < inv.buyPrice : false)
          )
          case "sold":
          return (
            matchesSearch&&(inv.sellPrice !==null && inv.sellPrice !== undefined)
          )
        case "best":
          const sorted = [...investments].sort((a, b) => {
            const aROI = a.currentValue
              ? (a.currentValue - a.buyPrice) / a.buyPrice
              : 0
            const bROI = b.currentValue
              ? (b.currentValue - b.buyPrice) / b.buyPrice
              : 0
            return bROI - aROI
          })
          const top25 = sorted.slice(0, Math.ceil(sorted.length * 0.25))
          return matchesSearch && top25.some((topInv) => topInv.id === inv.id)
        default:
          return matchesSearch
      }
    })
  }, [investments, filters])

  // Debounced search with useCallback
  const debouncedSearch = useCallback(
    debounce((term: string) => dispatch(setFilter({ searchTerm: term })), 300),
    [dispatch]
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => debouncedSearch.cancel()
  }, [searchTerm, debouncedSearch])

  // Fetch prices with cleanup
  useEffect(() => {
    if (!investments || investments.length === 0) return

    const fetchPrices = () => {
      investments.forEach((inv) => dispatch(fetchStockPrice(inv.symbol)))
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)

    return () => clearInterval(interval)
  }, [investments, dispatch])

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      dispatch(setFilter({ [key]: value }))
    },
    [dispatch]
  )

  const handleAddInvestment = useCallback(
    (investment: Omit<Investment, "id" | "currentValue">) => {
      dispatch(addInvestment(investment))
      setIsFormOpen(false)
    },
    [dispatch]
  )

  if (status === "loading" && investments.length === 0) {
    return (
      <div className="container  mt-16 md:mt-0 mx-auto px-4 py-8">
        <SkeletonLoader className="h-12 w-64 mb-6 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SkeletonLoader className="lg:col-span-2 h-80 rounded-xl" />
          <SkeletonLoader className="h-80 rounded-xl" />
        </div>
        <SkeletonLoader className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="container mx-auto  mt-16 md:mt-0 px-4 py-8">
      {/* Header with animated gradient */}
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
          Investment Portfolio
        </h1>
        <p className="text-muted-foreground">
          Track and analyze your investments with precision
        </p>
      </motion.header>

      {/* Search and Filter Section */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search investments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Button (Mobile) */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background"
            aria-expanded={isFilterOpen}
            aria-label="Toggle filters">
            <RiArrowUpDownLine />
            <span>Filters</span>
          </button>

          {/* Filter Controls */}
          <div className={`${isFilterOpen ? "flex" : "hidden"} md:flex gap-3`}>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              aria-label="Filter by date range">
              <option value="all">All Time</option>
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>

            <select
              value={filters.performanceFilter}
              onChange={(e) =>
                handleFilterChange("performanceFilter", e.target.value)
              }
              className="px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              aria-label="Filter by performance">
              <option value="all">All Investments</option>
              <option value="profit">Profitable</option>
              <option value="loss">Losing</option>
              <option value="best">Top Performers</option>
              <option value="sold">Sold</option>  
            </select>
          </div>
        </div>

        {/* Add Investment Button */}
        <motion.button
          onClick={() => setIsFormOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          aria-label="Add new investment">
          <FiPlus className="w-5 h-5" />
          <span>Add Investment</span>
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8">
        <SummaryCards investments={filteredInvestments} />
      </motion.div>

      {/* Chart and Top Performers */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        <div className="lg:col-span-2 bg-card p-1 sm:p-6 rounded-xl shadow-sm border border-border transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Performance Overview</h2>
          </div>
          <PerformanceChart investments={filteredInvestments} />
        </div>

        <div className="bg-card p-1 sm:p-6 rounded-xl shadow-sm border border-border transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FiAward className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Top Performers</h2>
          </div>
          <TopPerformers investments={filteredInvestments} />
        </div>
      </motion.div>

      {/* Investment Table */}
      <motion.div
        className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FiPieChart className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Your Investments</h2>
          </div>
        </div>
       <Suspense>

        <InvestmentTable
          investments={filteredInvestments}
          
        />
       </Suspense>
      </motion.div>

      {/* Investment Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <InvestmentForm
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleAddInvestment}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default InvestmentManagement
