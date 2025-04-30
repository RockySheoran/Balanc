


"use server"
/** @format */

import { UPDATE_TRANSACTION_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"


interface ActionResponse {
  status: number
  message: string
  errors: Record<string, string[]>
  data?: any
}

export const updateTransactionAction = async (
  prevState: ActionResponse | null,
  payload: { formData: FormData; token: string }
): Promise<ActionResponse> => {
  // Authentication
  const { formData, token } = payload

  // const session = await getServerSession(authOptions)
  if (!token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
      errors: {},
    }
  }

  // Prepare raw data
  const rawData = {
    id: formData.get("id"),
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    category: formData.get("category"),

    description: formData.get("description"),
  }
  console.log(rawData)

  // Validate with Zod
  

  try {
    const response = await axios.post(UPDATE_TRANSACTION_URL, rawData, {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    })
    console.log(response.data.data.updatedTransaction)
    return {
      status: 200,
      message: "Transaction updat successfully",
      errors: {},
      data: response.data,
    }
  } catch (error) {
    console.log(error.response?.data)
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
