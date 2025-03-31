/** @format */

"use server"
/** @format */

import { CREATE_TRANSACTION_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

interface ActionResponse {
  status: number
  message: string
  errors: Record<string, string[]>
  data?: any
}

export const newTransactionAction = async (
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> => {
  // Authentication
  const session = await getServerSession(authOptions)
  if (!session?.token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
      errors: {},
    }
  }

  // Prepare raw data
  const rawData = {
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    category: formData.get("category"),
   
    description: formData.get("description"),
  }

  // Validate with Zod


 
  try {
    const response = await axios.post(CREATE_TRANSACTION_URL, rawData, {
      headers: {
        Authorization: `${session?.token}`,
        "Content-Type": "application/json",
      },
    })
console.log(response.data)
    return {
      status: 200,
      message: "Transaction created successfully",
      errors: {},
      data: response.data,
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 422) {
        return {
          status: 422,
          message: error.response?.data?.message,
          errors: error.response?.data?.errors,
        }
      }
    }
    return {
      status: 500,
      message: "Something went wrong.please try again!",
      errors: {},
      data: {},
    }
  }
}
