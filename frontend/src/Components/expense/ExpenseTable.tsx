/** @format */

import React, { useEffect } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/Components/ui/pagination"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { setCurrentPage } from "@/lib/Redux/features/expense/expenseSlice"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

const ExpenseTable: React.FC = () => {
  const dispatch = useAppDispatch()

  // Get state from Redux
  const {
    expenses = [],
    filteredExpenses = [],
    filterState: { currentPage, itemsPerPage },
  } = useAppSelector((state) => ({
    expenses: state.expenses.expenses,
    filteredExpenses: state.expenses.filteredExpenses,
    filterState: state.expenses.filterState,
  }))

  // Debugging logs
//   useEffect(() => {
//     console.log("Expenses:", expenses)
//     console.log("Filtered Expenses:", filteredExpenses)
//     console.log("Current Page:", currentPage)
//     console.log("Items per Page:", itemsPerPage)
//   }, [expenses, filteredExpenses, currentPage, itemsPerPage])

  const categories = Array.from(new Set(expenses.map((e) => e.category)))

  // Pagination logic with safeguards
  const safeFilteredExpenses =
    filteredExpenses.length > 0 ? filteredExpenses : expenses
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = safeFilteredExpenses.slice(
    indexOfFirstItem,
    indexOfLastItem
  )
  const totalPages = Math.ceil(safeFilteredExpenses.length / itemsPerPage)

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      dispatch(setCurrentPage(1))
    }
  }, [currentPage, totalPages, dispatch])

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <Table>
        <TableCaption className="text-left p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Expense Records
            </h2>
            <span className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, safeFilteredExpenses.length)} of{" "}
              {safeFilteredExpenses.length} expenses
              {filteredExpenses.length !== expenses.length && " (filtered)"}
            </span>
          </div>
        </TableCaption>

        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentItems.length > 0 ? (
            currentItems.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell>
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor:
                        COLORS[
                          categories.indexOf(expense.category) % COLORS.length
                        ] + "20",
                      color:
                        COLORS[
                          categories.indexOf(expense.category) % COLORS.length
                        ],
                    }}>
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ${expense.amount}
                </TableCell>
                <TableCell className="text-gray-500">
                  {expense.description || "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                {filteredExpenses.length === 0 && expenses.length > 0
                  ? "No expenses match your filters"
                  : "No expenses found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {safeFilteredExpenses.length > itemsPerPage && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    dispatch(setCurrentPage(Math.max(currentPage - 1, 1)))
                  }
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => dispatch(setCurrentPage(page))}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    dispatch(
                      setCurrentPage(Math.min(currentPage + 1, totalPages))
                    )
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export default ExpenseTable
