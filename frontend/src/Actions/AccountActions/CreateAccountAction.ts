/**
 * @format
 * Server action for creating a new account
 * Implements proper error handling, validation, and session management
 */

"use server"

import { CREATE_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { headers } from "next/headers"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"


interface AccountActionResponse {
  status: number
  message: string
  errors: Record<string, string[]>
  data?: any
}

interface AccountFormData {
  name: string
  type: string
  income: string
}

/**
 * Server action to create a new account
 * @param prevState - Previous state from useFormState hook
 * @param formData - Form data submitted
 * @returns Promise<AccountActionResponse> - Response with status, message, and errors
 */
export const CreateAccountAction = async (
  prevState: AccountActionResponse | null,
  formData: FormData
): Promise<AccountActionResponse> => {
  // Get session and validate authentication
  const session = (await getServerSession(authOptions)) as Session & {
    token?: string
  }

  if (!session?.token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
      errors: {},
    }
  }

  // Extract and validate form data
  const rawData = {
    name: formData.get("name")?.toString().trim(),
    type: formData.get("type")?.toString().trim(),
    income: formData.get("income")?.toString().trim(),
  }



  // Prepare data for API
  const data: AccountFormData = {
    name: rawData.name!,
    type: rawData.type!,
    income: rawData.income!,
  }

  try {
    const response = await axios.post(CREATE_ACCOUNT_URL, data, {
      headers: {
        Authorization: `${session.token}`,
        "Content-Type": "application/json",
    
      },
      timeout: 5000, // 5-second timeout
    })

    // Log successful creation (consider adding more details)
    console.log(`Account created: ${data.name} (${data.type})`)

    return {
      status: 200,
      message: "Account created successfully",
      errors: {},
      data: response.data,
    }
  } catch (error) {
    // Enhanced error handling
    if (error instanceof AxiosError) {
      // Handle validation errors from server
      if (error.response?.status === 422) {
        return {
          status: 422,
          message: error.response?.data?.message || "Validation failed",
          errors: error.response?.data?.errors || {},
        }
      }

      // Handle unauthorized/forbidden
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          status: error.response.status,
          message: "Session expired - Please login again",
          errors: {},
        }
      }

      // Handle server errors
      if ((error.response?.status ?? 0) >= 500) {
        return {
          status: 503,
          message: "Service unavailable - Please try again later",
          errors: {},
        }
      }
    }

    // Fallback for unexpected errors
    console.error("Account creation error:", error)
    return {
      status: 500,
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    }
  }
}
