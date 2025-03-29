"use server"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { GetServerSession } from "@/Components/common/getSeverSesstion"


import { GET_ALL_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios from "axios"
import { getServerSession ,Session} from "next-auth"

export const getAllAccounts = async()=>{
    try {
        const session = (await getServerSession(authOptions)) as Session & {
          token?: string
        }

          if (!session?.token) {
            return {
              status: 401,
              message: "Unauthorized - Please login first",
              errors: {},
            }
          }
        const response = await axios.get(GET_ALL_ACCOUNT_URL, {
          headers: {
            Authorization: `${session?.token}`,
            "Content-Type": "application/json",
          },
        })
        
        return {
          status: 200,
          message: "Accounts fetched successfully",
          data: response.data.data,
        }
        
    } catch (error) {
        console.log(error+"cvfd")
        return {
            status: 500,
            message: "An error occurred while fetching accounts",
            errors: {},
        }
        
    }
}