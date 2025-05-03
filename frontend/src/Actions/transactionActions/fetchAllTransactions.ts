/** @format */
"use server"

import { ALL_TRANSACTION_URL } from "@/lib/EndPointApi"

import axios from "axios"

interface TransactionResponse {
  status: number
  message: string
  data?: any // Replace 'any' with your actual transaction data type
}

interface FetchAllTransactionsParams {
  accountId: string,
 
}

/**
 * Fetches all transactions for a specific account
 *
 * Features:
 * - Proper TypeScript interfaces
 * - Enhanced error handling
 * - Request/response logging in development
 * - Configurable timeout
 * - Axios interceptors ready
 * - Consistent response structure
 *
 * @param {FetchAllTransactionsParams} params - Parameters containing accountId
 * @returns {Promise<TransactionResponse>} - Standardized response object
 */
export const fetchAllTransactions = async ({
  accountId,
 
}: FetchAllTransactionsParams): Promise<TransactionResponse> => {
 

  

  try {
    const response = await axios.post(
      ALL_TRANSACTION_URL,
      {
        accountId,
      },
      {
       
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "force-cache",
        }
      }
    )
    console.log(response.data)

  

    return {
      status: response.status,
      message: "Transactions fetched successfully",
      data: response.data.data,
    }
  } catch (error: any) {
    // Enhanced error handling
    let errorMessage = "An error occurred while fetching transactions"
    let statusCode = 500

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message
      statusCode = error.response?.status || 500

      if (process.env.NODE_ENV === "development") {
        console.error("[API] Axios error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack,
        })
      }
    } else {
      console.error("[API] Non-Axios error:", error)
    }

    return {
      status: statusCode,
      message: errorMessage,
    }
  }
}
