"use server"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { GetServerSession } from "@/Components/common/getSeverSesstion"


import { DELETE_ACCOUNT_URL, GET_ALL_ACCOUNT_URL } from "@/lib/EndPointApi"
import axios from "axios"
import { getServerSession ,Session} from "next-auth"

export const deleteAccountAction = async ({ accountId }: { accountId: string }) => {
try{
console.log(accountId)
    const response = await axios.post(DELETE_ACCOUNT_URL,{ accountId})
    console.log(response)
    return {
      status: 200,
      message: "Accounts delete successfully",
     
    }
  } catch (error) {
  
    return {
      status: 500,
      message: "An error occurred while fetching accounts",
      errors: {},
    }
  }
}