/** @format */

// src/validators/accountValidator.ts
import { z } from "zod"

// 🎯 AccountType Enum
export const AccountTypeEnum = z.enum([
  "SAVINGS",
  "CHECKING",
  "CREDIT",
  "INVESTMENT",
])

// 🎯 Account Schema Validation
export const accountSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Account name must be at least 3 characters long" }),
  type: AccountTypeEnum,
  income: z
    .number()
    .nonnegative({ message: "Income cannot be negative" })
    .optional(),

})

// 🎯 Account Update Schema
export const accountUpdateSchema = accountSchema.partial()
