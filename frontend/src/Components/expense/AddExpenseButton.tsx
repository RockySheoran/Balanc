/** @format */
"use client"

import React, { useActionState, useEffect, useCallback, useMemo, useState } from "react"
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
import { addTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"
import { updateAccount } from "@/lib/Redux/features/account/accountSlice"


// Constants moved outside component
const CATEGORIES = [
  "Food",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Health",
  "Education",
  "transfer",
  "Other",
] as const

const TRANSACTION_TYPES = [
  "TRANSFER",
  "DEBIT",
  "CASH",
  "EXPENSE",
] as const

const INITIAL_STATE = {
  message: "",
  status: 0,
  errors: {},
  data: null,
}

export const AddExpenseButton = () => {
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [formState, formAction] = useActionState(
    newTransactionAction,
    INITIAL_STATE
  )

  // Selectors
  const { selectedAccount } = useAppSelector((store) => store.account)
  const { token } = useAppSelector((state) => state.user)

  // Memoized form submission handler
  const handleFormAction = useCallback(
    (formData: FormData) => {
      if (!token) {
        toast.error("Authentication required")
        return
      }
      return formAction({ formData, token })
    },
    [formAction, token]
  )

  // Effect for handling form state changes
  useEffect(() => {
    if (formState.status === 500) {
      toast.error(formState.message)
    } else if (formState.status === 200 && formState.data) {
      toast.success(formState.message)
      dispatch(addExpense(formState.data.data.transaction))
      dispatch(addTransaction(formState.data.data.transaction))
      dispatch(updateAccount(formState.data.data.updatedAccount))
     
      setIsOpen(false)
    }
  }, [formState, dispatch])

  // Reset form state when dialog closes
  const handleClose = useCallback(() => {
    setIsOpen(false)
    formState.errors = {}
    formState.message = ""
  }, [formState])

  // Memoized account ID for hidden input
  const accountId = useMemo(
    () => selectedAccount?.id || "",
    [selectedAccount?.id]
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer sm:w-auto">Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add New Expense
          </DialogTitle>
        </DialogHeader>
        <form action={handleFormAction} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />

          <FormField
            label="Name"
            id="name"
            name="name"
            required
            errors={formState.errors}>
            <Input
              id="name"
              name="name"
              required
              className="mt-2 w-full"
              aria-invalid={!!formState.errors?.name}
            />
          </FormField>

          <FormField
            label="Amount"
            id="amount"
            name="amount"
            required
            errors={formState.errors}>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              required
              className="mt-2 w-full"
              aria-invalid={!!formState.errors?.amount}
            />
          </FormField>

          <SelectField
            label="Type"
            id="type"
            name="type"
      
            options={TRANSACTION_TYPES}
    
            placeholder="Select transaction type"
            required
            errors={formState.errors}
          />

          <SelectField
            label="Category"
            id="category"
            name="category"
            
            options={CATEGORIES}
            placeholder="Select category"
            required
            errors={formState.errors}
          />

          <FormField
            label="Description (Optional)"
            id="description"
            name="description"
            errors={formState.errors}>
            <Textarea
              id="description"
              name="description"
              className="mt-2 w-full"
            />
          </FormField>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div>
              <SubmitButton />
            </div>
          </div>

          {formState.errors?.form && (
            <p className="mt-2 text-sm text-red-500">{formState.errors.form}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Extracted FormField component for better reusability
const FormField = ({
  label,
  id,
  name,
  required = false,
  errors,
  children,
}: {
  label: string
  id: string
  name: string
  required?: boolean
  errors?: Record<string, string>
  children: React.ReactNode
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    {children}
    {errors?.[name] && (
      <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
    )}
  </div>
)

// Extracted SelectField component
const SelectField = ({
  label,
  id,
  name,
  options,
  placeholder,
  required = false,
  errors,
}: {
  label: string
  id: string
  name: string
  options: readonly string[]
  placeholder: string
  required?: boolean
  errors?: Record<string, string>
}) => (
  <FormField
    label={label}
    id={id}
    name={name}
    required={required}
    errors={errors}>
    <Select name={name} required={required} aria-invalid={!!errors?.[name]}>
      <SelectTrigger id={id} className={errors?.[name] ? "border-red-500" : ""}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FormField>
)

export default React.memo(AddExpenseButton)
