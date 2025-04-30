/** @format */
"use client"
import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { resetFilters, selectCategories, setFilter } from "@/lib/Redux/features/income/incomeSlices"



type SortOption = "" | "asc" | "desc" | "date-asc" | "date-desc"
type IncomeType = "" | "CREDIT" | "INCOME"

const IncomeFilters = () => {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories)
  const filterState = useSelector((state: any) => state.income.filters)
  const { sort, category, type, minAmount, maxAmount } = filterState
// Example usage in a component
const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  dispatch(setFilter({ sort: e.target.value as SortOption }))
}

const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  console.log(e.target.value)
  dispatch(setFilter({ category: e.target.value }))
}

const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  console.log(e.target.value )
  dispatch(setFilter({ type: e.target.value as IncomeType }))
}

const handleAmountRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: "min" | "max") => {
  const value = e.target.value ? Number(e.target.value) : ""
  dispatch(setFilter({ [type === "min" ? "minAmount" : "maxAmount"]: value }))
}

const handleReset = () => {
  dispatch(resetFilters())
}
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-2 md:mb-0">
          Filter Income
        </h2>
        <button
          onClick={handleReset}
          className="px-3 py-1 cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 text-sm">
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
          value={sort}
            onChange={handleSortChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-800 dark:text-white">
            <option value="">Default</option>
            <option value="asc">Amount (Low to High)</option>
            <option value="desc">Amount (High to Low)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="date-desc">Date (Newest First)</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-800 dark:text-white">
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-800 dark:text-white">
            <option value="">All Types</option>
            <option value="CREDIT">CREDIT</option>
            <option value="INCOME">INCOME</option>
          </select>
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount Range
          </label>
          <div className="flex space-x-2">
            <input
              value={minAmount}
              type="number"
              placeholder="Min"
              onChange={(e) => handleAmountRangeChange(e, "min")}
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-800 dark:text-white"
              min="0"
            />
            <input
              value={maxAmount}
              type="number"
              placeholder="Max"
              onChange={(e) => handleAmountRangeChange(e, "max")}
              className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-800 dark:text-white"
              min="0"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default IncomeFilters
