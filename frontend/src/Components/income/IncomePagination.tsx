/** @format */
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"

import { useCallback, useMemo } from "react"
import { selectCurrentPage, selectTotalPages, setPage } from "@/lib/Redux/features/income/incomeSlices"

const IncomePagination = () => {
  const dispatch = useAppDispatch()
  const currentPage = useAppSelector(selectCurrentPage)
  const totalPages = useAppSelector(selectTotalPages)

  // Memoize page numbers to prevent recalculation
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }, [totalPages])

  // Memoized page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        dispatch(setPage(page))
      }
    },
    [dispatch, totalPages]
  )

  // Early return if no pagination needed
  if (totalPages <= 1) return null

  // Button base classes
  const baseButtonClasses =
    "px-3 py-1 rounded-md transition-colors duration-200"
  const activeButtonClasses = "bg-indigo-600 text-white"
  const inactiveButtonClasses =
    "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
  const disabledButtonClasses =
    "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${baseButtonClasses} ${
            currentPage === 1 ? disabledButtonClasses : inactiveButtonClasses
          }`}
          aria-label="Previous page">
          Previous
        </button>

        {/* Show limited page numbers for large pagination */}
        {totalPages <= 7 ? (
          pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`${baseButtonClasses} ${
                currentPage === page
                  ? activeButtonClasses
                  : inactiveButtonClasses
              }`}
              aria-label={`Go to page ${page}`}>
              {page}
            </button>
          ))
        ) : (
          <>
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              className={`${baseButtonClasses} ${
                currentPage === 1 ? activeButtonClasses : inactiveButtonClasses
              }`}>
              1
            </button>

            {/* Ellipsis or pages */}
            {currentPage > 3 && <span className="px-2">...</span>}

            {/* Current page and neighbors */}
            {[currentPage - 1, currentPage, currentPage + 1].map(
              (page) =>
                page > 1 &&
                page < totalPages && (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`${baseButtonClasses} ${
                      currentPage === page
                        ? activeButtonClasses
                        : inactiveButtonClasses
                    }`}>
                    {page}
                  </button>
                )
            )}

            {/* Ellipsis or pages */}
            {currentPage < totalPages - 2 && <span className="px-2">...</span>}

            {/* Last page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`${baseButtonClasses} ${
                currentPage === totalPages
                  ? activeButtonClasses
                  : inactiveButtonClasses
              }`}>
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${baseButtonClasses} ${
            currentPage === totalPages
              ? disabledButtonClasses
              : inactiveButtonClasses
          }`}
          aria-label="Next page">
          Next
        </button>
      </div>
    </motion.div>
  )
}

export default IncomePagination
