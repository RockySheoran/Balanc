"use server"



import { GET_ALL_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"




export const getAllAccounts = async({token}: { token: string })=>{
    try {
//         const session = (await getServerSession(authOptions)) as Session & {
//           token?: string
//         }
// console.log(session)
            //  console.log(token)
          if (!token) {
            return {
              status: 401,
              message: "Unauthorized - Please login first",
              errors: {},
            }
          }
        const response = await axios.get(GET_ALL_ACCOUNT_URL, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "force-cache",
            
          },
        })
        
        console.log(response.data)
        
      
        return {
          status: 200,
          message: "Accounts fetched successfully",
          data: response.data.data,
       
        }
        
    } catch (error) {
      if(error instanceof AxiosError){
        console.log(error.response)
        if(error.response?.status === 404 ){
        return {
          status: error.response?.status,
          message: error.response?.data?.message,
          errors: error.response?.data?.errors,
        }
      }
        
        return {
            status: 500,
            message: "An error occurred while fetching accounts",
            errors: {},
        }
      }
    }
}