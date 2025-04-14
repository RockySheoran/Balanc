/** @format */

"use client"
import React, { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { format } from "date-fns"
import { SellInvestmentDialog } from "./SellStockDialog"


interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentValue?: number
  buyDate: string
}

interface InvestmentTableProps {
  investments: Investment[]
  
}

export function InvestmentTable({
  investments = [],

}: InvestmentTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null)
  const itemsPerPage = 10

  // Calculate pagination values
  const { totalPages, paginatedInvestments, pageRange } = useMemo(() => {
    const totalItems = investments.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginatedInvestments = investments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )

    // Calculate page range for pagination
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

  const formatCurrency = (value?: number) => {
    return value ? `$${value.toFixed(2)}` : "N/A"
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getProfitLossColor = (value: number) => {
    if (!value) return "text-foreground"
    return value > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400"
  }

  const handleSellSuccess = () => {
    // You would typically refresh the investments data here
    console.log("Investment sold successfully")
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800">
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Buy Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>P/L</TableHead>
            <TableHead>ROI</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedInvestments.map((investment) => {
            const profitLoss =
              (investment.currentValue || 0 - investment.buyPrice) *
              investment.quantity
            const roi = investment.currentValue
              ? ((investment.currentValue - investment.buyPrice) /
                  investment.buyPrice) *
                100
              : 0

            return (
              <TableRow key={investment.id}>
                <TableCell className="font-medium">
                  {investment.symbol}
                </TableCell>
                <TableCell>{investment.name}</TableCell>
                <TableCell>{formatDate(investment.buyDate)}</TableCell>
                <TableCell>{investment.quantity}</TableCell>
                <TableCell>{formatCurrency(investment.buyPrice)}</TableCell>
                <TableCell
                  className={getProfitLossColor(
                    investment.currentValue || 0 - investment.buyPrice
                  )}>
                  {formatCurrency(investment.currentValue)}
                </TableCell>
                <TableCell className={getProfitLossColor(profitLoss)}>
                  {formatCurrency(profitLoss)}
                </TableCell>
                <TableCell className={getProfitLossColor(roi)}>
                  {investment.currentValue ? `${roi.toFixed(2)}%` : "N/A"}
                </TableCell>
                <TableCell className="flex gap-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(investment.id)}>
                    View
                  </Button> */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSelectedInvestment(investment)}>
                    Sell
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}>
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3">
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
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
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}>
                First
              </Button>
              {pageRange.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}>
                Last
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Dialog */}
      <SellInvestmentDialog
        investment={selectedInvestment}
        open={!!selectedInvestment}
        onOpenChange={(open) => !open && setSelectedInvestment(null)}
        onSuccess={handleSellSuccess}
      />
    </div>
  )
}
