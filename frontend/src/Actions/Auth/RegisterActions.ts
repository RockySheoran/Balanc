/**
 * @format
 * Server action for user registration with enhanced validation and security
 */

"use server"

import { registerApi } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

interface RegisterResponse {
  status: number
  message: string
  errors?: Record<string, string[]>
  data?: {
    token?: string
    user?: {
      id: string
      name: string
      email: string
      verified: boolean
    }
  }
}



/**
 * Server action to handle user registration
 */
export async function registerAction(
  prevState: RegisterResponse | null,
  formData: FormData
): Promise<RegisterResponse> {
 
  try {
    const payload = {
      name: formData.get("name")?.toString().trim(),
      email: formData.get("email")?.toString().trim(),
      password: formData.get("password")?.toString(),
      confirm_password: formData.get("confirm_password")?.toString(),
    }

    const response = await axios.post(registerApi, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 10000, // 10-second timeout
    })


    return {
      status: 200,
      message:
        "Account created successfully! Please check your email to verify your account.",
      // data: response.data,
    }
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof AxiosError) {
      // Handle validation errors
      if (error.response?.status === 422) {
        return {
          status: 422,
          message: error.response?.data?.message || "Validation failed",
          errors: error.response?.data?.errors || {},
        }
      }

     

      // Handle server errors
     

      // Handle timeout
      if (error.code === "ECONNABORTED") {
        return {
          status: 504,
          message: "Request timeout - Please try again",
          errors: {},
        }
      }
    }

    return {
      status: 500,
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    }
  }
}
