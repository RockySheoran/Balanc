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

const categories = [
  "Food",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Health",
  "Education",
  "Other",
]

const transactionTypes = [
  "CREDIT",
  "TRANSFER",
  "DEBIT",
  "INVESTMENT",
  "CASH",
  "INCOME",
  "EXPENSES",
]

const initialState = {
  message: "",
  status: 0,
  errors: {},
  data: null,
}

const AddExpenseButton = () => {
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [formState, formAction] = useActionState(
    newTransactionAction,
    initialState
  )
  const { selectedAccount } = useAppSelector((store) => store.account)

  useEffect(() => {
    if (formState.status === 500) {
      toast.error(formState.message)
    } else if (formState.status === 200 && formState.data) {
      toast.success(formState.message)
      dispatch(addExpense(formState.data.data.transaction))
      
      setIsOpen(false)
    }
  }, [formState])

  const handleClose = () => {
    setIsOpen(false)
    formState.errors = {}
    formState.message = ""
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add New Expense
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="accountId"
            value={selectedAccount?.id || ""}
          />

          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="mt-2 w-full" />
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              required
              className="mt-2 w-full"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select name="type" required>
              <SelectTrigger id="type">
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
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select name="category" required>
              <SelectTrigger id="category">
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
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              className="mt-2 w-full"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddExpenseButton
