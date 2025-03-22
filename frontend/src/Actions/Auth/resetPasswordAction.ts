/** @format */

import { RESET_PASSWORD_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

export async function resetPasswordAction(prevState: any, formData: FormData) {
  try {
    const { data } = await axios.post(RESET_PASSWORD_URL, {
      email: formData.get("email"),
      password: formData.get("password"),
      confirm_password: formData.get("confirm_password"),
      token: formData.get("token"),
    })
    return {
      status: 200,
      message: data?.message,
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
