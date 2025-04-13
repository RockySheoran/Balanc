/** @format */
"use client"
import React, { useMemo, useCallback, useState } from "react"
// import type { Investment } from "@/types/investment"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { format } from "date-fns"
import { Investment } from "./investment"

interface InvestmentTableProps {
  investments: Investment[]
  onSelect: (id: string) => void
  onSell: (
    id: string,
    sellData: { sellPrice: number; sellDate: string; quantitySold: number }
  ) => Promise<void>
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  investments = [],
  onSelect,
  onSell,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null)
  const [sellPrice, setSellPrice] = useState("")
  const [sellDate, setSellDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [sellQuantity, setSellQuantity] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
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
  }, [investments, currentPage])

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
  }, [])

  // Format date
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }, [])

  // Format currency with consistent decimal places
  const formatCurrency = useCallback((value?: number) => {
    return value ? `$${value.toFixed(2)}` : "N/A"
  }, [])

  // Handle page navigation
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages]
  )

  const nextPage = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage]
  )
  const prevPage = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage]
  )

  // Handle sell action
  const handleSellClick = useCallback((investment: Investment) => {
    setSelectedInvestment(investment)
    setSellPrice(investment.currentValue?.toString() || "")
    setSellQuantity(investment.quantity.toString())
    setSellDialogOpen(true)
  }, [])

  const handleSellConfirm = useCallback(async () => {
    if (!selectedInvestment || !sellPrice || !sellDate || !sellQuantity) return

    setIsProcessing(true)
    try {
      await onSell(selectedInvestment.id, {
        sellPrice: parseFloat(sellPrice),
        sellDate,
        quantitySold: parseInt(sellQuantity),
      })
      setSellDialogOpen(false)
    } catch (error) {
      console.error("Error selling investment:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedInvestment, sellPrice, sellDate, sellQuantity, onSell])

  const calculateSellProfitLoss = useCallback(() => {
    if (!selectedInvestment || !sellPrice) return 0
    return (
      (parseFloat(sellPrice) - selectedInvestment.buyPrice) *
      (parseInt(sellQuantity) || selectedInvestment.quantity)
    )
  }, [selectedInvestment, sellPrice, sellQuantity])

  const calculateSellROI = useCallback(() => {
    if (!selectedInvestment || !sellPrice) return 0
    return (
      ((parseFloat(sellPrice) - selectedInvestment.buyPrice) /
        selectedInvestment.buyPrice) *
      100
    )
  }, [selectedInvestment, sellPrice])

  // Table headers
  const headers = useMemo(
    () => [
      "Symbol",
      "Name",
      "Date",
      "Quantity",
      "Buy Price",
      "Current Price",
      "P/L",
      "ROI",
      "Actions",
    ],
    []
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 even:bg-gray-50/50 dark:even:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {investment.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {investment.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(investment.buyDate.split("T")[0])}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {investment.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
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
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium ">
                    {/* <button
                      onClick={() => onSelect(investment.id)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors duration-150 hover:underline">
                      View
                    </button> */}
                    {/* <Button
                      onClick={() => handleSellClick(investment)}
                      className="text-red-600 cursor-pointer dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium transition-colors duration-150 hover:underline">
                      Sell
                    </Button> */}
                    <button
                      onClick={() => handleSellClick(investment)}
                      className="
    px-3 py-1.5
    text-sm font-medium
    text-white bg-red-600
    rounded-lg shadow-sm
    transition-all duration-200
    hover:bg-red-700 hover:shadow-md
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
    dark:bg-red-700 dark:hover:bg-red-600
    flex items-center justify-center
    gap-1
  ">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Sell
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
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
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
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
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                        currentPage === 1
                          ? "z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-300"
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}>
                      1
                    </button>
                    {pageRange[0] > 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        ? "z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-300"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}>
                    {page}
                  </button>
                ))}

                {pageRange[pageRange.length - 1] < totalPages && (
                  <>
                    {pageRange[pageRange.length - 1] < totalPages - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                        currentPage === totalPages
                          ? "z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-300"
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}>
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
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

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sell Investment</DialogTitle>
            <DialogDescription>
              Confirm the sale details for {selectedInvestment?.name} (
              {selectedInvestment?.symbol})
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buyPrice" className="text-right">
                  Buy Price
                </Label>
                <Input
                  id="buyPrice"
                  value={formatCurrency(selectedInvestment.buyPrice)}
                  className="col-span-3"
                  disabled
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedInvestment.quantity}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">
                    Max: {selectedInvestment.quantity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellPrice" className="text-right">
                  Sell Price
                </Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellDate" className="text-right">
                  Sell Date
                </Label>
                <Input
                  id="sellDate"
                  type="date"
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total Value</Label>
                <div className="col-span-3">
                  {sellPrice && sellQuantity
                    ? formatCurrency(
                        parseFloat(sellPrice) * parseInt(sellQuantity)
                      )
                    : "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right mr-10  ">Profit/Loss</Label>
                <div
                  className={`col-span-3 ml-3 pl-10${getProfitLossColor(
                    calculateSellProfitLoss(),
                    0
                  )}`}>
                  {formatCurrency(calculateSellProfitLoss())}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">ROI</Label>
                <div
                  className={`col-span-3 ${getProfitLossColor(
                    calculateSellROI(),
                    0
                  )}`}>
                  {calculateSellROI().toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSellDialogOpen(false)}
              disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleSellConfirm}
              disabled={!sellPrice || !sellQuantity || isProcessing}
              className="bg-red-600 hover:bg-red-700">
              {isProcessing ? "Processing..." : "Confirm Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default React.memo(InvestmentTable)
