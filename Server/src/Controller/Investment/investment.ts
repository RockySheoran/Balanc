/** @format */

import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

import { ZodError } from "zod"
import { investmentSchema } from "../../Validation/investmentValidation.js"
import { formatError } from "../../helper.js"
import redisClient from "../../Config/redis/redis.js"

const prisma = new PrismaClient()

// 🎯 Create Investment
export const createInvestment = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    const data = req.body
    // console.log(data)
    // const payload = await investmentSchema.parse(data)
    const investment = await prisma.investment.create({
      data: {
        accountId: data.accountId,
        userId,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        amount: data.currentPrice * data.quantity,
        quantity: data.quantity,
        buyDate: new Date(data.buyDate),
        buyPrice: data.currentPrice,
        sellPrice: data.sellPrice ? data.sellPrice : null,
        sellDate: null,

        currentValue: data.currentPrice,
      },
    })
    // Invalidate Redis cache for this account's investments
    const cacheKey = `investments:${data.accountId}`
    await redisClient.del(cacheKey)
    res.status(201).json({
      message: "Investment created successfully",
      data: {
        investment,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors })
    }
    console.log(error)
    res.status(500).json({ error: (error as Error).message })
  }
}

// 📈 Get All Investments
export const getAllInvestments = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    
    const {accountId }=req.body
    // console.log(accountId)
    // await prisma.investment.deleteMany({
    //   where: { accountId },
    // })
    const cacheKey = `investments:${accountId}`

    // Try to get cached data first
    const cachedInvestments = await redisClient.get(cacheKey)
    if (cachedInvestments) {
      return res.status(200).json({
        success: true,
        message: "Data found (cached)",
        data: JSON.parse(cachedInvestments),
        cached: true,
      })
    }
    const investments = await prisma.investment.findMany({
      where: { accountId: accountId },
      orderBy: { createdAt: "desc" },
    })
    // console.log(investments)
     await redisClient.setEx(cacheKey, 3600, JSON.stringify(investments))
    res.status(200).json({ message: "Data Found", data:{investments} })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}



// �� delete Investment
// export const deleteInvestment = async (req: Request, res: Response) :Promise<any> => {
//   try {
//     const { id } = req.params
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       })
//     }
//     const userId = req.user?.id

//     const investment = await prisma.investment.findUnique({
//       where: { id },
//     })

//     if (!investment || investment.userId !== userId) {
//       return res.status(404).json({
//         success: false,
//         message: "Investment not found or unauthorized",
//       })
//     }

//     await prisma.investment.delete({
//       where: { id },
//     })
//     const cacheKey = `investments:${accountId}`
//     await redisClient.del(cacheKey)

//     res.status(200).json({
//       success: true,
//       message: "Investment deleted successfully",
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: (error as Error).message,
//     })
//   }
// }

// ✏️ Update Investment
// export const updateInvestment = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       })
//     }
//     const userId = req.user?.id
//     const data = req.body

//     const payload = await investmentSchema.parse(data)
//     const investment = await prisma.investment.findUnique({
//       where: { id },
//     })

//     if (!investment || investment.userId !== userId) {
//       return res.status(404).json({
//         success: false,
//         message: "Investment not found or unauthorized",
//       })
//     }


//     const updatedInvestment = await prisma.investment.update({
//       where: { id },
//       data: {
//         name: payload.name,
//         type: payload.type,
//         amount: payload.amount,
//         quantity: payload.quantity,
//         buyDate: payload.buyDate,
//         sellDate: payload.sellDate,
//         currentValue: payload.currentValue,
//       },
//     })

//     res.status(200).json({
//       success: true,
//       message: "Investment updated successfully",
//       investment: updatedInvestment,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: (error as Error).message,
//     })
//   }
// }