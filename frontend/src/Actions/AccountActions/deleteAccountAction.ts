/** @format */

"use server"

import { DELETE_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

interface DeleteAccountResponse {
  status: number
  message: string
  errors?: Record<string, string[]>
  data?: any
}

/**
 * Server action to delete an account
 * @param accountId - The ID of the account to delete
 * @returns Promise<DeleteAccountResponse> - Response with status and message
 */
export const deleteAccountAction = async ({
  accountId,
  token,
}: {
  accountId: string
  token: string
}): Promise<DeleteAccountResponse> => {
  // Validate input
  if (!accountId || typeof accountId !== "string") {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
    }
  }

  // Get and verify session
  // const session = (await getServerSession(authOptions)) as Session & {
  //   token?: string
  // }

  if (!token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
    }
  }
  // console.log(token,accountId)

  try {
    const response = await axios.post(
      DELETE_ACCOUNT_URL,
      { accountId },
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      
      }
    )

    // Log successful deletion (consider adding more details)
    console.log(`Account deleted: ${accountId}`)

    return {
      status: 200,
      message: "Account deleted successfully",
      data: response.data,
    }
  } catch (error) {
    console.log(error)
    // Enhanced error handling
    if (error instanceof AxiosError) {
      // Handle not found
      if (error.response?.status === 404) {
        return {
          status: 404,
          message: "Account not found or already deleted",
        }
      }

      

      // Handle validation errors
      if (error.response?.status === 422) {
        return {
          status: 422,
          message: error.response?.data?.message || "Validation failed",
          errors: error.response?.data?.errors || {},
        }
      }

      // Handle server errors
      if ((error.response?.status ?? 0) >= 500) {
        return {
          status: 503,
          message: "Service unavailable - Please try again later",
        }
      }
    }

    // Fallback for unexpected errors
    console.error("Account deletion error:", error)
    return {
      status: 500,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}
