/** @format */

// src/validators/transactionValidator.ts
import { z } from "zod"

// 🎯 TransactionType Enum
export const TransactionTypeEnum = z.enum(["CREDIT","TRANSFER", "DEBIT","INVESTMENT","CASH"])

// 🎯 Transaction Schema Validation
export const transactionSchema = z.object({
  accountId: z.string().length(24, { message: "Invalid Account ID format" }),
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  type: TransactionTypeEnum,
  category: z
    .string()
    .min(3, { message: "Category must be at least 3 characters long" }),
  description: z.string(),

})

// 🎯 Transaction Update Schema
export const transactionUpdateSchema = transactionSchema.partial()
