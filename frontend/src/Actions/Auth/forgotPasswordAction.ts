/** @format */
"use server"
import { FORGOT_PASSWORD_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  try {
    await axios.post(FORGOT_PASSWORD_URL, {
      email: formData.get("email"),
    })
    return {
      status: 200,
      message: "Email sent successfully!! Please check your email.",
      errors: {},
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
    }
  }
}
