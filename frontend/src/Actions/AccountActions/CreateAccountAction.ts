/** @format */
"use server"

import { CREATE_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

interface AccountActionResponse {
  status: number
  message: string
  errors: Record<string, string[]>
  data?: any
}

interface AccountFormData {
  name: FormDataEntryValue | null
  type: FormDataEntryValue | null
  income: FormDataEntryValue | null
}

export const CreateAccountAction = async (
  prevState: AccountActionResponse | null,
  formData: FormData
): Promise<AccountActionResponse> => {
  // Get session on server side
  const session = await getServerSession(authOptions)

  if (!session?.token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
      errors: {},
    }
  }

  const data: AccountFormData = {
    name: formData.get("name"),
    type: formData.get("type"),
    income: formData.get("income"),
  }

  try {
    const response = await axios.post(CREATE_ACCOUNT_URL, data, {
      headers: {
        Authorization: ` ${session?.token}`,
        "Content-Type": "application/json",
      },
    })

    return {
      status: 200,
      message: "Account created successfully",
      errors: {},
      data: response.data,
    }
  } catch (error) {
    const axiosError = error as AxiosError

    if (axiosError.response?.status === 401) {
      return {
        status: 401,
        message: "Session expired - Please login again",
        errors: {},
      }
    }

    if (axiosError.response?.status === 422) {
      return {
        status: 422,
        message: axiosError.response.data?.message || "Validation failed",
        errors: axiosError.response.data?.errors || {},
      }
    }

    console.error("Account creation error:", error)
    return {
      status: 500,
      message: "Something went wrong. Please try again!",
      errors: {},
    }
  }
}
