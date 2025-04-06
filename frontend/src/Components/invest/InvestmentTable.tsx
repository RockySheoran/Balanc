/** @format */
"use client"
import React, { useMemo, useCallback } from "react"
import { Investment } from "./investment"

interface InvestmentTableProps {
  investments: Investment[]
  onSelect: (id: string) => void
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  investments = [],
  onSelect,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Memoized calculations for performance
  const { totalPages, paginatedInvestments, pageRange } = useMemo(() => {
    const totalItems = investments.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedInvestments = investments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )

    // Calculate page range for pagination (max 5 pages shown)
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)

    if (currentPage <= 3) {
      endPage = Math.min(5, totalPages)
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(totalPages - 4, 1)
    }

    const pageRange = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    )

    return { totalPages, paginatedInvestments, pageRange }
  }, [investments, currentPage, itemsPerPage])

  // Memoized profit/loss calculations
  const getProfitLossColor = useCallback(
    (value: number, comparisonValue: number) => {
      if (!value) return "text-gray-500"
      return value > comparisonValue
        ? "text-green-600 font-semibold"
        : value < comparisonValue
        ? "text-red-600 font-semibold"
        : "text-gray-500"
    },
    []
  )

  const calculateProfitLoss = useCallback((investment: Investment) => {
    if (!investment?.currentValue) return 0
    return (investment.currentValue - investment.buyPrice) * investment.quantity
  }, [])

  const calculateROI = useCallback((investment: Investment) => {
    if (!investment.currentValue) return 0
    return (
      ((investment.currentValue - investment.buyPrice) / investment.buyPrice) *
      100
    )
  }, []) // <-- Properly closed hook
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency with consistent decimal places
  const formatCurrency = (value?: number) => {
    return value ? `$${value.toFixed(2)}` : "N/A"
  }

  // Handle page navigation
  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              {[
                "Symbol",
                "Name",
                "Date",
                "Quantity",
                "Buy Price",
                "Current Price",
                "P/L",
                "ROI",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedInvestments.map((investment) => {
              const profitLoss = calculateProfitLoss(investment)
              const roi = calculateROI(investment)
              const priceColorClass = getProfitLossColor(
                investment.currentValue || 0,
                investment.buyPrice
              )
              const plColorClass = getProfitLossColor(profitLoss, 0)
              const roiColorClass = getProfitLossColor(roi, 0)

              return (
                <tr
                  key={investment.id}
                  className="hover:bg-gray-50 transition-colors duration-150 even:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {investment.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {investment.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(investment.buyDate.split("T")[0])}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {investment.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatCurrency(investment.buyPrice)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${priceColorClass}`}>
                      {formatCurrency(investment?.currentValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${plColorClass}`}>
                      {formatCurrency(profitLoss)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${roiColorClass}`}>
                      {investment.currentValue ? `${roi.toFixed(2)}%` : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onSelect(investment.id)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-150 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, investments.length)}
                </span>{" "}
                of <span className="font-medium">{investments.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {pageRange[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      1
                    </button>
                    {pageRange[0] > 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )}
                  </>
                )}

                {pageRange.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {page}
                  </button>
                ))}

                {pageRange[pageRange.length - 1] < totalPages && (
                  <>
                    {pageRange[pageRange.length - 1] < totalPages - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(InvestmentTable)