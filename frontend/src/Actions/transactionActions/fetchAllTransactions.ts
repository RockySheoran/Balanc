
import { ALL_TRANSACTION_URL } from "@/lib/EndPointApi"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import axios from "axios"


export const fetchAllTransactions = async ({ accountId }: { accountId: string }) => {
  try {
    
   console.log(accountId+"ffffffffffffffffffffffffffffffffffffffff")
    const response = await axios.post(ALL_TRANSACTION_URL, {
      accountId,
    })
    console.log(response.data)

    return {
      status: 200,
      message: "Transactions fetched successfully",
      data: response.data.data,
    }
  } catch (error) {
    return {
      status: 500,
      message: "An error occurred while fetching transaction",
    }
  }
}