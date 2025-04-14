/** @format */
"use server"
import { registerApi } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

export async function registerAction(prevState: any, formData: FormData) {

  try {
    console.log(registerApi)
   const data = await axios.post(registerApi, {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirm_password: formData.get("confirm_password"),
    },{
  headers: {
    'Content-Type': 'application/json',
  }
  })
    console.log(data)
    return {
      status: 200,
      message:
        "Account created successfully! Please check your email and verify your email.",
      errors: {},
    }
  } catch (error) {
    console.log(error)
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
