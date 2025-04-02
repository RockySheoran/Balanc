/** @format */

import React from "react"
import { useSelector, useDispatch } from "react-redux"

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
import { resetFilters, setCategoryFilter, setDateRange, setSearchTerm, setSortBy, setSortOrder } from "@/lib/Redux/features/expense/expenseSlice"
import { useAppSelector } from "@/lib/Redux/store/hooks"

const ExpenseFilters: React.FC = () => {
  const dispatch = useDispatch()
  const { searchTerm, dateRange, categoryFilter, sortBy, sortOrder, expenses } =
    useAppSelector((state: RootState) => ({
      ...state.expenses.filterState,
      expenses: state.expenses.expenses,
    }))

  const categories = Array.from(new Set(expenses.map((e) => e.category)))

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) =>
                    dispatch(
                      setDateRange(range || { from: undefined, to: undefined })
                    )
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            value={categoryFilter}
            onValueChange={(value) => dispatch(setCategoryFilter(value))}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <Select
            value={sortBy}
            onValueChange={(value) => dispatch(setSortBy(value as any))}>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <Select
            value={sortOrder}
            onValueChange={(value) => dispatch(setSortOrder(value as any))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => dispatch(resetFilters())}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExpenseFilters
