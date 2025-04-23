/** @format */

"use server"

import { UPDATE_INVEST_URL } from "@/lib/EndPointApi"
import axios from "axios"
import { stat } from "fs"
import { revalidatePath } from "next/cache"

export async function sellInvestment(prevState: any, formData: FormData) {
  try {
    // Validate form data
    const errors: any = {}
    const sellPrice = Number(formData.get("sellPrice"))
    const quantitySold = Number(formData.get("quantitySold"))
    const sellDate = formData.get("sellDate")
    const investmentId = formData.get("investmentId")

    if (!sellPrice || sellPrice <= 0) {
      errors.sellPrice = ["Sell price must be greater than 0"]
    }
    if (!quantitySold || quantitySold <= 0) {
      errors.quantitySold = ["Quantity must be greater than 0"]
    }
    if (!sellDate) {
      errors.sellDate = ["Sell date is required"]
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }
    const data   = {
      id: investmentId,
      sellPrice: sellPrice,
      quantitySold: quantitySold,
      sellDate: sellDate,
    }

        const response = await axios.post(UPDATE_INVEST_URL, data )
        console.log("Investment sold successfully:", response.data)
        
          return { status :200 ,success: true, message: "Investment sold successfully" ,investment: response.data.investment}
      



    
  } catch (error) {
    console.error("Error selling investment:", error)
    return {
      status: 500,
      success: false,
      message: "Failed to sell investment",
      errors: {
        sellPrice: ["An error occurred during processing"],
        quantitySold: [],
        sellDate: [],
      },
    }
  }
}
