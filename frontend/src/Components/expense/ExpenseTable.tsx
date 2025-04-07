/** @format */
import React, { memo, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/Components/ui/pagination";
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks";
import { setCurrentPage } from "@/lib/Redux/features/expense/expenseSlice";
import { motion } from "framer-motion";

const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#8884D8", // Purple
  "#82CA9D", // Green
];

const ExpenseTable: React.FC = memo(() => {
  const dispatch = useAppDispatch();

  // Memoized selector to prevent unnecessary re-renders
  const { expenses, filteredExpenses, currentPage, itemsPerPage } = useAppSelector(
    useCallback((state) => ({
      expenses: state.expenses.expenses,
      filteredExpenses: state.expenses.filteredExpenses,
      currentPage: state.expenses.filterState.currentPage,
      itemsPerPage: state.expenses.filterState.itemsPerPage,
    }), [])
  );

  // Memoized derived data
  const categories = useMemo(() => 
    Array.from(new Set(expenses.map((e) => e.category))), 
    [expenses]
  );

  const safeFilteredExpenses = useMemo(
    () => filteredExpenses.length > 0 ? filteredExpenses : expenses,
    [filteredExpenses, expenses]
  );

  const totalPages = useMemo(
    () => Math.ceil(safeFilteredExpenses.length / itemsPerPage),
    [safeFilteredExpenses.length, itemsPerPage]
  );

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return safeFilteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, safeFilteredExpenses]);

  // Reset to page 1 if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      dispatch(setCurrentPage(1));
    }
  }, [currentPage, totalPages, dispatch]);

  // Memoized event handlers
  const handlePreviousPage = useCallback(() => {
    dispatch(setCurrentPage(Math.max(currentPage - 1, 1)));
  }, [currentPage, dispatch]);

  const handleNextPage = useCallback(() => {
    dispatch(setCurrentPage(Math.min(currentPage + 1, totalPages)));
  }, [currentPage, totalPages, dispatch]);

  const handlePageChange = useCallback((page: number) => {
    dispatch(setCurrentPage(page));
  }, [dispatch]);

  const getCategoryColor = useCallback((category: string) => {
    const colorIndex = categories.indexOf(category) % COLORS.length;
    return {
      bgColor: `${COLORS[colorIndex]}20`,
      textColor: COLORS[colorIndex],
    };
  }, [categories]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow overflow-hidden mb-8"
    >
      <Table>
        <TableCaption className="text-left p-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Expense Records
            </h2>
            <span className="text-sm text-gray-500">
              Showing {Math.min(currentPage * itemsPerPage - itemsPerPage + 1, safeFilteredExpenses.length)}-
              {Math.min(currentPage * itemsPerPage, safeFilteredExpenses.length)} of{" "}
              {safeFilteredExpenses.length} expenses
              {filteredExpenses.length !== expenses.length && " (filtered)"}
            </span>
          </div>
        </TableCaption>

        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-[120px] sm:w-[150px]">Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden sm:table-cell">Description</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentItems.length > 0 ? (
            currentItems.map((expense) => {
              const { bgColor, textColor } = getCategoryColor(expense.category);
              return (
                <TableRow 
                  key={expense.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                      }}
                    >
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-500 truncate max-w-[200px]">
                    {expense.description || "-"}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {filteredExpenses.length === 0 && expenses.length > 0
                  ? "No expenses match your filters"
                  : "No expenses found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </motion.div>
  );
});

ExpenseTable.displayName = "ExpenseTable";
export default ExpenseTable;