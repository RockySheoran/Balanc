/** @format */

import { z } from "zod"

export const registerSchema = z
  .object({
    name: z
      .string({ message: "Name is required." })
      .min(3, { message: "Name must be 3 characters long." }),
    email: z
      .string({ message: "Email is required." })
      .email({ message: "Email must be correct." }),
    password: z
      .string({ message: "password is required" })
      .min(8, { message: "password must be 8 characters long." }),
    confirm_password: z
      .string({ message: "confirm_password is required." })
      .min(8, { message: "confirm_password must be 8 characters long." }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be correct.",
    path: ["confirm_password"],
  })

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .email({ message: "Email must be correct." }),
  password: z.string({ message: "Password is required." }),
})

export const forgetPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .email({ message: "Email must be correct." }),
})

export const reset_password_Schema = z
  .object({
    email: z
      .string({ message: "Email is required." })
      .email({ message: "Email must be correct." }),
    token: z.string({ message: "Email is required." }),
    password: z
      .string({ message: "password is required" })
      .min(8, { message: "password must be 8 characters long." }),
    confirm_password: z
      .string({ message: "confirm_password is required." })
      .min(8, { message: "confirm_password must be 8 characters long." }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be correct.",
    path: ["confirm_password"],
  })
