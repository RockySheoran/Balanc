"use server"
// import { authOptions } from "@/app/api/auth/[...nextauth]/options"
// import { GetServerSession } from "@/Components/common/getSeverSesstion"


import { GET_ALL_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios, { AxiosError } from "axios"
// import { getServerSession ,Session} from "next-auth"

export const getAllAccounts = async({token}: { token: string })=>{
    try {
//         const session = (await getServerSession(authOptions)) as Session & {
//           token?: string
//         }
// console.log(session)
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
        console.log(response +"sdfsdafsafsfsadfsfsfsf")
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