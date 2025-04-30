/** @format */
"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { selectPaginatedIncomes } from "@/lib/Redux/features/income/incomeSlices"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { useCallback, useMemo, useState } from "react"
import { FiTrash2, FiEdit } from "react-icons/fi"
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
import { deleteIncome, updateIncome } from "@/lib/Redux/features/income/incomeSlices"
import { toast } from "sonner"

import { updateTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"
import { updateTransactionAction } from "@/Actions/transactionActions/updateTransactionAction"
import { EditIncomeDialog } from "./EditIncomeDialog"


interface IncomeRowProps {
  income: {
    id: string
    name: string
    amount: number
    type: string
    category: string
    createdAt: string
    description?: string
    accountId?: string
  }
}

const IncomeRow = ({ income }: IncomeRowProps) => {
  const dispatch = useAppDispatch()
  const [deleteIncomeId, setDeleteIncomeId] = useState("")
  const [incomeToEdit, setIncomeToEdit] = useState<any>(null)
  const { token } = useAppSelector((state) => state.user)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteClick = useCallback((incomeId: string) => {
    setDeleteIncomeId(incomeId)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleEditClick = useCallback(() => {
    setIncomeToEdit(income)
  }, [income])

  const handleEditClose = useCallback(() => {
    setIncomeToEdit(null)
  }, [])
  
  const handleEditSubmit = useCallback(
    async (updatedIncome: any) => {
      // try {
        //   const data = await updateTransactionAction({
          //     id: updatedIncome.id,
      //     token: token || "",
      //     formData: {
      //       name: updatedIncome.name,
      //       amount: updatedIncome.amount.toString(),
      //       type: updatedIncome.type,
      //       category: updatedIncome.category,
      //       description: updatedIncome.description || "",
      //       accountId: updatedIncome.accountId || "",
      //     },
      //   })
      
      //   if (data.status === 200) {
      //     toast.success(data.message)
      //     dispatch(updateIncome(updatedIncome))
      //     dispatch(updateTransaction(updatedIncome))
      //     dispatch(updateAccount(data.data.updatedAccount))
      //     setIncomeToEdit(null)
      setIncomeToEdit(null)
      //   } else {
        //     toast.error(data.message)
      //   }
      // } catch (error) {
      //   toast.error("Failed to update income")
      // }
    },
    [dispatch, token]
  )

  const handleConfirmDelete = useCallback(async () => {
    if (deleteIncomeId) {
      try {
        const data = await DeleteTransAction({
          id: deleteIncomeId,
          token: token || "",
        })
        if (data.status == 200) {
          toast.success(data.message)
          dispatch(deleteIncome(deleteIncomeId))
          dispatch(deleteTransaction(deleteIncomeId))
          dispatch(updateAccount(data.data))
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error("Failed to delete income")
      } finally {
        setIsDeleteDialogOpen(false)
        setDeleteIncomeId("")
      }
    }
  }, [deleteIncomeId, dispatch, token])

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
    <>
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="hover:bg-gray-50"
      >
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
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 right-0 bg-white space-x-2 md:space-x-4">
          <button
            onClick={handleEditClick}
            className="text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors"
            aria-label="Edit income"
          >
            <FiEdit className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteClick(income.id)}
            className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
            aria-label="Delete income"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </td>
      </motion.tr>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      {incomeToEdit && (
        <EditIncomeDialog 
          income={incomeToEdit}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          token={token || ""}
        />
      )}
    </>
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
      className="mb-6"
    >
      <h2 className="text-xl font-semibold text-indigo-800 mb-4">
        Income Transactions
      </h2>

      <div className="relative overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider left-0 bg-gray-50">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider right-0 bg-gray-50">
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