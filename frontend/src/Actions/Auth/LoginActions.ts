/** @format */
"use server"

import { Check_loginApi } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    await axios.post(Check_loginApi, {
      email: formData.get("email"),
      password: formData.get("password"),
    })
    
    return {
      status: 200,
      message: "Credentials matched login you shortly!",
      errors: {},
      data: {
        email: formData.get("email"),
        password: formData.get("password"),
      },
    }
  } catch (error) {
    // console.log(error.response)
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        console.log(error.response)
        return {
          status: 401,
          message: error.response?.data?.error,
          errors: error.response?.data?.errors,
        }
      }
    }
    if (error instanceof AxiosError) {
      if (error.response?.status === 422) {
        // console.log(error.response)
        return {
          status: 422,
          message: error.response?.data?.error,
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
