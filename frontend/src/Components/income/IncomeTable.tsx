/** @format */

"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { selectPaginatedIncomes } from "@/lib/Redux/features/income/incomeSlices"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { useCallback, useMemo, useState } from "react"
import { FiTrash2 } from "react-icons/fi"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/Components/ui/dialog"
import { Button } from "@/Components/ui/button"
import { DeleteTransAction } from "@/Actions/transactionActions/DeleteTransAction"
import { deleteTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"
import { updateAccount } from "@/lib/Redux/features/account/accountSlice"
import { deleteIncome } from "@/lib/Redux/features/income/incomeSlices"
import { toast } from "sonner"

interface IncomeRowProps {
  income: {
    id: string
    name: string
    amount: number
    type: string
    category: string
    createdAt: string
    description?: string
  }
}

const IncomeRow = ({ income }: IncomeRowProps) => {
  const dispatch = useAppDispatch()
  const [deleteIncome1, onDeleteIncome] = useState("")
  const { token } = useAppSelector((state) => state.user)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDeleteClick = useCallback((expenseId: string) => {
    onDeleteIncome(expenseId)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (deleteIncome1) {
      try {
        const data = await DeleteTransAction({
          id: deleteIncome1,
          token: token || "",
        })
        if (data.status == 200) {
          toast.success(data.message)
          dispatch(deleteIncome(deleteIncome1))
          dispatch(deleteTransaction(deleteIncome1))
          dispatch(updateAccount(data.data))
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error("Failed to delete income")
      } finally {
        setIsDialogOpen(false)
        onDeleteIncome("")
      }
    }
  }, [deleteIncome1, dispatch, token])

  const formattedDate = useMemo(
    () => format(new Date(income.createdAt), "MMM dd, yyyy"),
    [income.createdAt]
  )

  const amountColor =
    income.type === "CREDIT" || income.type === "INCOME"
      ? "text-green-600"
      : "text-red-600"

  const amountSign =
    income.type === "CREDIT" || income.type === "INCOME" ? "+" : "-"

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 left-0 bg-white">
        {income.name}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm ${amountColor}`}>
        {amountSign}${income.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
        {income.type.toLowerCase()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {income.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
        {income.description || "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500  right-0 bg-white">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={() => {
                handleDeleteClick(income.id)
                setIsDialogOpen(true)
              }}
              className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
              aria-label="Delete income">
              <FiTrash2 className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this income record? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="cursor-pointer"
                variant="destructive"
                onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </motion.tr>
  )
}

const EmptyState = () => (
  <tr>
    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
      No income records found
    </td>
  </tr>
)

const IncomeTable = () => {
  const incomes = useAppSelector(selectPaginatedIncomes)
  const hasIncomes = incomes.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mb-6">
      <h2 className="text-xl font-semibold text-indigo-800 mb-4">
        Income Transactions
      </h2>

      <div className="relative overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider  left-0 bg-gray-50">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider  right-0 bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasIncomes ? (
                incomes.map((income) => (
                  <IncomeRow key={income.id} income={income} />
                ))
              ) : (
                <EmptyState />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

export default IncomeTable
