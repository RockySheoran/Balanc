/** @format */
import React, { useMemo, useCallback } from "react"
import { useDispatch } from "react-redux"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { cn } from "@/lib/utils"
import { Calendar } from "@/Components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"
import { RootState } from "@/lib/Redux/store/store"
import {
  resetFilters,
  setCategoryFilter,
  setDateRange,
  setSearchTerm,
  setSortBy,
  setSortOrder,
} from "@/lib/Redux/features/expense/expenseSlice"
import { useAppSelector } from "@/lib/Redux/store/hooks"

type SortByOption = "date" | "amount" | "name"
type SortOrderOption = "asc" | "desc"

const ExpenseFilters: React.FC = () => {
  const dispatch = useDispatch()
  const { searchTerm, dateRange, categoryFilter, sortBy, sortOrder, expenses } =
    useAppSelector((state: RootState) => ({
      ...state.expenses.filterState,
      expenses: state.expenses.expenses,
    }))

  // Memoize unique categories to prevent recalculation on every render
  const categories = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))),
    [expenses]
  )

  // Memoized event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchTerm(e.target.value))
    },
    [dispatch]
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      dispatch(setCategoryFilter(value))
    },
    [dispatch]
  )

  const handleSortByChange = useCallback(
    (value: string) => {
      dispatch(setSortBy(value as SortByOption))
    },
    [dispatch]
  )

  const handleSortOrderChange = useCallback(
    (value: string) => {
      dispatch(setSortOrder(value as SortOrderOption))
    },
    [dispatch]
  )

  const handleDateRangeChange = useCallback(
    (range: { from?: Date; to?: Date } | undefined) => {
      dispatch(setDateRange(range || { from: undefined, to: undefined }))
    },
    [dispatch]
  )

  const handleResetFilters = useCallback(() => {
    dispatch(resetFilters())
  }, [dispatch])

  // Format date range for display
  const formattedDateRange = useMemo(() => {
    if (!dateRange?.from) return "Pick a date range"
    if (!dateRange.to) return format(dateRange.from, "LLL dd, y")
    return `${format(dateRange.from, "LLL dd, y")} - ${format(
      dateRange.to,
      "LLL dd, y"
    )}`
  }, [dateRange])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 transition-all">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Filters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Date Range Picker */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date Range
          </label>
          <div className={cn("grid gap-2")}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedDateRange}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sorting and Reset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Order
          </label>
          <Select value={sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExpenseFilters)
