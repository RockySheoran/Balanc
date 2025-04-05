/** @format */
"use client"
import React from "react"
import { Investment } from "./investment"


interface InvestmentTableProps {
  investments: Investment[]
  onSelect: (id: string) => void
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  investments,
  onSelect,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(investments?.length / itemsPerPage)
  const paginatedInvestments = investments?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getProfitLossColor = (investment: Investment) => {
    if (!investment.currentPrice) return "text-gray-500"
    return investment.currentPrice > investment.buyPrice
      ? "text-green-600"
      : investment.currentPrice < investment.buyPrice
      ? "text-red-600"
      : "text-gray-500"
  }

  const calculateProfitLoss = (investment: Investment) => {
    if (!investment.currentPrice) return 0
    return (investment.currentPrice - investment.buyPrice) * investment.quantity
  }

  const calculateROI = (investment: Investment) => {
    if (!investment.currentPrice) return 0
    return (
      ((investment.currentPrice - investment.buyPrice) / investment.buyPrice) *
      100
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P/L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedInvestments?.map((investment) => (
              <tr key={investment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {investment.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {investment.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {investment.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${investment.buyPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {investment.currentPrice
                    ? `$${investment.currentPrice.toFixed(2)}`
                    : "N/A"}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${getProfitLossColor(
                    investment
                  )}`}>
                  {investment.currentPrice
                    ? `$${calculateProfitLoss(investment).toFixed(2)}`
                    : "N/A"}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${getProfitLossColor(
                    investment
                  )}`}>
                  {investment.currentPrice
                    ? `${calculateROI(investment).toFixed(2)}%`
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onSelect(investment.id)}
                    className="text-blue-600 hover:text-blue-900">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
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
                  {Math.min(currentPage * itemsPerPage, investments?.length)}
                </span>{" "}
                of <span className="font-medium">{investments?.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}>
                      {page}
                    </button>
                  )
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestmentTable
