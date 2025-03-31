/** @format */

import { z } from "zod"

// 🎯 TransactionType Enum
export const TransactionTypeEnum = z.enum([
  "CREDIT",
  "TRANSFER",
  "DEBIT",
  "INVESTMENT",
  "CASH",
  "INCOME",
  "EXPENSES",
])

// 🎯 Date validation helper
const isValidDate = (date: string): boolean => {
  return !isNaN(Date.parse(date))
}

// 🎯 Transaction Schema Validation
export const transactionSchema = z.object({
  accountId: z.string().length(24, {
    message: "Invalid Account ID format - must be 24 characters",
  }),
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  amount: z.coerce
    .number()
    .positive({ message: "Amount must be greater than 0" })
    .max(1000000, { message: "Amount cannot exceed 1,000,000" }),
  type: TransactionTypeEnum,
  category: z
    .string()
    .min(3, { message: "Category must be at least 3 characters long" })
    .max(30, { message: "Category cannot exceed 30 characters" }),
  
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
})

// 🎯 Transaction Update Schema

