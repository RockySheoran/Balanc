/**
 * @format
 * Server action for password reset with robust validation and security
 */

"use server"

import { RESET_PASSWORD_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
import { redirect } from "next/navigation"

interface ResetPasswordResponse {
  status: number
  message: string
  errors?: Record<string, string[]>
  data?: {
    success?: boolean
    redirect?: string
  }
}


/**
 * Server action to handle password reset
 */
export async function resetPasswordAction(
  prevState: ResetPasswordResponse | null,
  formData: FormData
): Promise<ResetPasswordResponse> {

  try {
    const payload = {
      email: formData.get("email")?.toString().trim(),
      password: formData.get("password")?.toString(),
      confirm_password: formData.get("confirm_password")?.toString(),
      token: formData.get("token")?.toString(),
    }

    const { data } = await axios.post(RESET_PASSWORD_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 10000, // 10-second timeout
    })

    // Redirect to login page if successful
    if (data.success) {
      redirect("/login")
    }

    return {
      status: 200,
      message: data?.message || "Password reset successfully",
      data: {
        success: true,
        redirect: "/login",
      },
    }
  } catch (error) {
    console.error("Password reset error:", error)

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

    return {
      status: 500,
      message: "An unexpected error occurred. Please try again.",
      errors: {},
    }
  }
}
