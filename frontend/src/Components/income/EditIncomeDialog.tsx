/** @format */
"use client";

import React, { useActionState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";
import { updateIncome } from "@/lib/Redux/features/income/incomeSlices";
import { toast } from "sonner";
import { SubmitButton } from "../common/SubmitButton";
import { updateTransaction } from "@/lib/Redux/features/transactions/transactionsSlice";
import { updateAccount } from "@/lib/Redux/features/account/accountSlice";
import { updateTransactionAction } from "@/Actions/transactionActions/updateTransactionAction";

const CATEGORIES = [
  "Salary", 
  "Freelance",
  "Investment",
  "Gift",
  "Other",
] as const;

const TRANSACTION_TYPES = [
  "CREDIT",
  "INCOME",
] as const;

const INITIAL_STATE = {
  message: "",
  status: 0,
  errors: {},
  data: null,
};

interface EditIncomeDialogProps {
  income: {
    id: string
    name: string
    amount: number
    type: string
    category: string
    description?: string
    accountId?: string
  };
  onClose: () => void;
  onSubmit: (updatedIncome: any) => void;
  token: string;
}

export const EditIncomeDialog: React.FC<EditIncomeDialogProps> = ({
  income,
  onClose,
  onSubmit,
  token,
}) => {
  const dispatch = useDispatch();
  const [formState, formAction] = useActionState(
    updateTransactionAction,
    INITIAL_STATE
  );

  // Memoized form submission handler
  const handleFormAction = useCallback(
    (formData: FormData) => {
      formData.append("id", income.id);
      return formAction({ formData, token });
    },
    [formAction, token, income.id]
  );

  // Effect for handling form state changes
  useEffect(() => {
    if (formState.status === 500) {
      toast.error(formState.message);
    } else if (formState.status === 200 && formState.data) {
        dispatch(updateIncome(formState.data.data.updatedTransaction));
        dispatch(updateTransaction(formState.data.data.updatedTransaction));
        dispatch(updateAccount(formState.data.data.updatedAccount));
        toast.success(formState.message);
        onSubmit(formState.data.data.updatedTransaction);
    }
  }, [formState, dispatch, onSubmit]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit Income
          </DialogTitle>
        </DialogHeader>
        <form action={handleFormAction} className="space-y-4">
          <input type="hidden" name="accountId" value={income.accountId} />

          <FormField
            label="Name"
            id="name"
            name="name"
            required
            errors={formState.errors}
          >
            <Input
              id="name"
              name="name"
              required
              defaultValue={income.name}
              className="mt-2 w-full"
              aria-invalid={!!formState.errors?.name}
            />
          </FormField>

          <FormField
            label="Amount"
            id="amount"
            name="amount"
            required
            errors={formState.errors}
          >
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={income.amount}
              className="mt-2 w-full"
              aria-invalid={!!formState.errors?.amount}
            />
          </FormField>

          <SelectField
            label="Type"
            id="type"
            name="type"
            options={TRANSACTION_TYPES}
            defaultValue={income.type}
            placeholder="Select transaction type"
            required
            errors={formState.errors}
          />

          <SelectField
            label="Category"
            id="category"
            name="category"
            options={CATEGORIES}
            defaultValue={income.category}
            placeholder="Select category"
            required
            errors={formState.errors}
          />

          <FormField
            label="Description (Optional)"
            id="description"
            name="description"
            errors={formState.errors}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={income.description}
              className="mt-2 w-full"
            />
          </FormField>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
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
  );
};

// Extracted FormField component for better reusability
const FormField = ({
  label,
  id,
  name,
  required = false,
  errors,
  children,
}: {
  label: string;
  id: string;
  name: string;
  required?: boolean;
  errors?: Record<string, string>;
  children: React.ReactNode;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    {children}
    {errors?.[name] && (
      <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
    )}
  </div>
);

// Extracted SelectField component with defaultValue support
const SelectField = ({
  label,
  id,
  name,
  options,
  defaultValue,
  placeholder,
  required = false,
  errors,
}: {
  label: string;
  id: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder: string;
  required?: boolean;
  errors?: Record<string, string>;
}) => (
  <FormField
    label={label}
    id={id}
    name={name}
    required={required}
    errors={errors}
  >
    <Select
      name={name}
      required={required}
      defaultValue={defaultValue}
      aria-invalid={!!errors?.[name]}
    >
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
);