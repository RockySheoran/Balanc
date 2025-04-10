/** @format */

import { z } from "zod"
enum InvestmentType {
  STOCK,
  BOND,
  REAL_ESTATE,
  MUTUAL_FUND,
}

export const investmentSchema = z.object({
  accountId: z
    .string({
      required_error: "Account ID is required",
      invalid_type_error: "Account ID must be a string",
    })
    .min(24, "Invalid Account ID")
    .max(24, "Invalid Account ID"),
  name: z
    .string({
      required_error: "Investment name is required",
      invalid_type_error: "Investment name must be a string",
    })
    .min(3, "Investment name must be at least 3 characters long")
    .max(50, "Investment name cannot exceed 50 characters"),
  type: z.nativeEnum(InvestmentType, {
    required_error: "Investment type is required",
    invalid_type_error: "Invalid investment type",
  }),
  amount: z
    .number({
      required_error: "Investment amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than zero"),
  quantity: z
    .number({
      invalid_type_error: "Quantity must be a number",
    })
    .optional(),
  buyDate: z
    .string({
      required_error: "Buy date is required",
      invalid_type_error: "Invalid buy date format",
    })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format. Use ISO format (YYYY-MM-DD).",
    })
    .transform((date) => new Date(date)),
  sellDate: z
    .string({
      invalid_type_error: "Invalid sell date format",
    })
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "Invalid sell date format. Use ISO format (YYYY-MM-DD).",
    })
    .transform((date) => (date ? new Date(date) : undefined)),
  currentValue: z
    .number({
      invalid_type_error: "Current value must be a number",
    })
    .optional(),
})
