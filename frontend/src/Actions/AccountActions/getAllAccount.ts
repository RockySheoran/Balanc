/** @format */

"use server"

import { GET_ALL_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  // Add other account properties as needed
}

interface GetAllAccountsResponse {
  status: number
  message: string
  data?: Account[]
  errors?: Record<string, string[]>
  meta?: {
    total: number
    page: number
    limit: number
  }
}

/**
 * Server action to fetch all accounts for the authenticated user
 * @returns Promise<GetAllAccountsResponse> - Response with accounts data or error
 */
export const getAllAccounts = async (): Promise<GetAllAccountsResponse> => {
  try {
    // Get and verify session
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

    // Make API request with proper headers and timeout
    const response = await axios.get(GET_ALL_ACCOUNT_URL, {
      headers: {
        Authorization: `Bearer ${session.token}`, // Added Bearer prefix
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Helps identify AJAX requests
      },
      timeout: 10000, // 10-second timeout
    })

    // Validate response data structure
    if (!response.data?.data) {
      console.warn("Unexpected API response structure", response.data)
      return {
        status: 500,
        message: "Unexpected response format from server",
        errors: {},
      }
    }

    return {
      status: 200,
      message: "Accounts fetched successfully",
      data: response.data.data,
      meta: response.data.meta, // Include pagination metadata if available
    }
  } catch (error) {
    // Enhanced error handling
    if (error instanceof AxiosError) {
      // Handle unauthorized/forbidden
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          status: error.response.status,
          message: "Session expired - Please login again",
          errors: {},
        }
      }

      // Handle not found
      if (error.response?.status === 404) {
        return {
          status: 404,
          message: "No accounts found",
          errors: {},
          data: [], // Return empty array instead of undefined
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
    console.error("Error fetching accounts:", error)
    return {
      status: 500,
      message: "An unexpected error occurred while fetching accounts",
      errors: {},
    }
  }
}
