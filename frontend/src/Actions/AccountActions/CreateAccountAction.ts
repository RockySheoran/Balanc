
"use server"
import { CREATE_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"

export const CreateAccountAction = async  (prevState:any,formData:FormData)=>{
const data ={
       name:formData.get("name"),
       type:formData.get("type"),
       income:formData.get("income")
    }
    console.log(data)
try {
  console.log(CREATE_ACCOUNT_URL)
  const response = await axios.post(CREATE_ACCOUNT_URL,{
       name:formData.get("name"),
       type:formData.get("type"),
       income:formData.get("income")
    })
    console.log(response)
    return {
      status: 200,
      message: "Account created successfully",
      errors: {}
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