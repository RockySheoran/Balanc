/** @format */
"use client"
import React, { useActionState, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { Textarea } from "@/Components/ui/textarea"
import { addExpense } from "@/lib/Redux/features/expense/expenseSlice"
import { newTransactionAction } from "@/Actions/transactionActions/newTransactionAction"
import { toast } from "sonner"
import { SubmitButton } from "../common/SubmitButton"
import { useAppSelector } from "@/lib/Redux/store/hooks"


// Type definitions
type Category =
  | "Food"
  | "Utilities"
  | "Transportation"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Other"
type TransactionType =
  | "CREDIT"
  | "TRANSFER"
  | "DEBIT"
  | "INVESTMENT"
  | "CASH"
  | "INCOME"
  | "EXPENSES"


const initialState = {
  message: "",
  status: 0,
  errors: {},
  data: null,
}

const categories: Category[] = [
  "Food",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Health",
  "Education",
  "Other",
]

const transactionTypes: TransactionType[] = [
  "CREDIT",
  "TRANSFER",
  "DEBIT",
  "INVESTMENT",
  "CASH",
  "INCOME",
  "EXPENSES",
]

const AddExpenseButton: React.FC = () => {
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [formState, formAction] = useActionState(
    newTransactionAction,
    initialState
  )
  useEffect(() => {
    if (formState.status === 500) {
      toast.error(formState.message)
    } else if (formState.status === 200) {
      toast.success(formState.message)
      if (formState.data) {
        console.log(formState.data.data.transaction)
        dispatch(addExpense(formState.data.data.transaction))
      }
      setIsOpen(false)
    }
  }, [formState, dispatch])

  const handleClose = () => {
    setIsOpen(false)
    // Reset form state when closing
    formState.errors = {}
    formState.message = ""
  }
const { selectedAccount } = useAppSelector((store: { account: { selectedAccount: { id: string } | null } }) => store.account)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={handleClose}>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          {formState.message && !formState.status && (
            <p className="text-red-500 text-sm">{formState.message}</p>
          )}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
        <input 
    type="hidden" 
    name="accountId" 
    value={selectedAccount?.id || ""} 
  />

          {/* Name Field */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              className="mt-2"
              id="name"
              name="name"
              required
              aria-describedby="name-error"
            />
            {formState.errors?.name && (
              <div id="name-error" className="text-red-500 text-sm mt-1">
                {formState.errors.name}
              </div>
            )}
          </div>

          {/* Amount Field */}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              className="mt-2"
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              aria-describedby="amount-error"
            />
            {formState.errors?.amount && (
              <div id="amount-error" className="text-red-500 text-sm mt-1">
                {formState.errors.amount}
              </div>
            )}
          </div>

          {/* Type Select */}
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
             
              required>
              <SelectTrigger id="type" aria-describedby="type-error">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formState.errors?.type && (
              <div id="type-error" className="text-red-500 text-sm mt-1">
                {formState.errors.type}
              </div>
            )}
          </div>

          {/* Category Select */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              name="category"
           
              required>
              <SelectTrigger id="category" aria-describedby="category-error">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formState.errors?.category && (
              <div id="category-error" className="text-red-500 text-sm mt-1">
                {formState.errors.category}
              </div>
            )}
          </div>

          

          {/* Description Field */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              aria-describedby="description-error"
            />
            {formState.errors?.description && (
              <div id="description-error" className="text-red-500 text-sm mt-1">
                {formState.errors.description}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="">
              <SubmitButton />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddExpenseButton
