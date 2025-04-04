/**
 * @format
 * Server action for user login with enhanced security and validation
 */

"use server"

import { Check_loginApi } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

import { redirect } from "next/navigation"

interface LoginResponse {
  status: number
  message: string
  errors?: Record<string, string[]>
  data?: {
    token?: string
    user?: {
      email: string
      // Add other user properties as needed
    }
  }
}

/**
 * Server action to handle user login
 * @param prevState - Previous state from useFormState hook
 * @param formData - Form data containing email and password
 * @returns Promise<LoginResponse> - Response with status, message, and data
 */
export async function loginAction(
  prevState: LoginResponse | null,
  formData: FormData
): Promise<LoginResponse> {
  // Extract and validate form data
  const email = formData.get("email")?.toString().trim()
  const password = formData.get("password")?.toString()



  try {
    const response = await axios.post(
      Check_loginApi,
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 10000, // 10-second timeout
      }
    )

    // Validate response structure
    if (!response.data?.token) {
      console.error("Login API response missing token", response.data)
      return {
        status: 500,
        message: "Unexpected response from server",
        errors: {},
      }
    }

   

    // Redirect to dashboard after successful login
    redirect("/dashboard")

    // Return statement is unreachable due to redirect
    // but required for TypeScript
    return {
      status: 200,
      message: "Login successful",
      data: {
        token: response.data.token,
        user: response.data.user,
      },
    }
  } catch (error) {
    // Enhanced error handling
    if (error instanceof AxiosError) {
      // Handle validation errors
      if (error.response?.status === 422) {
        return {
          status: 422,
          message: error.response?.data?.message || "Validation failed",
          errors: error.response?.data?.errors || {},
        }
      }


      

      // Handle timeout
      if (error.code === "ECONNABORTED") {
        return {
          status: 504,
          message: "Request timeout - Please try again",
          errors: {},
        }
      }
    }

    // Fallback for unexpected errors
    console.error("Login error:", error)
    return {
      status: 500,
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    }
  }
}
