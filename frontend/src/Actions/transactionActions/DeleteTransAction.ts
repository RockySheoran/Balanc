/** @format */

"use server"


import { DELETE_TRANSACTION_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"



/**
 * Server action to delete a transaction
 * @param id - The ID of the transaction to delete
 * @returns Promise<DeleteTransResponse> - Response with status and message
 */
export const DeleteTransAction = async ({
  id,
  token,
}: {
  id: string
  token: string
}): Promise<any> => {
  // Validate input
  if (!id || typeof id !== "string") {
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


  try {
    const response = await axios.post(
      DELETE_TRANSACTION_URL,
      { id },
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    console.log(response.data)

    return {
      status: 200,
      message: "Transaction deleted successfully",
      data: response.data.data.updatedAccount,
    }
  } catch (error) {
    console.log(error)
    // Enhanced error handling
    if (error instanceof AxiosError) {
      // Handle not found
      if (error.response?.status === 404) {
        return {
          status: 404,
          message: "Transaction not found or already deleted",
        }
      }

      return {
        status: 500,
        message: "An unexpected error occurred. Please try again.",
      }
    }
  }
}
