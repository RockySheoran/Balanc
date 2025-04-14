/** @format */

"use server"

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

    // Here you would typically:
    // 1. Verify the investment exists
    // 2. Check available quantity
    // 3. Process the sale in your database
    // 4. Create a transaction record

    // Mock processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would return the updated investment data
    revalidatePath("/investments") // Revalidate the investments page

    return { success: true, message: "Investment sold successfully" }
  } catch (error) {
    console.error("Error selling investment:", error)
    return {
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
