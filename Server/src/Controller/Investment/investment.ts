/** @format */

import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

import { ZodError } from "zod"
import { investmentSchema } from "../../Validation/investmentValidation.js"
import { formatError } from "../../helper.js"

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
    const payload = await investmentSchema.parse(data)
    const investment = await prisma.investment.create({
      data: {
        accountId: payload.accountId,
        userId,
        name: payload.name,
        type: payload.type,
        amount: payload.amount,
        quantity: payload.quantity,
        buyDate: payload.buyDate,
        sellDate: payload.sellDate,
        currentValue: payload.currentValue,
      },
    })
    res
      .status(201)
      .json({ message: "Investment created successfully", investment })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors })
    }
    res.status(500).json({ error: (error as Error).message })
  }
}

// 📈 Get All Investments
export const getAllInvestments = async (
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
    const investments = await prisma.investment.findMany({
      where: { userId },
    })
    res.status(200).json({ message: "Data Found", investments })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}

// 📅 Get Investments by Date
export const getInvestmentsByDate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { date } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        buyDate: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
      },
    })
    res.status(200).json({ message: "Data Found", investments })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}

// 🗓️ Get Investments by Month
export const getInvestmentsByMonth = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { year, month } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    const startDate = new Date(`${year}-${month}-01`)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    const investments = await prisma.investment.findMany({
      where: {
        userId,
        buyDate: {
          gte: startDate,
          lt: endDate,
        },
      },
    })
    res.status(200).json({ message: "Data Found", investments })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}

// 📆 Get Investments by Year
export const getInvestmentsByYear = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { year } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31`)

    const investments = await prisma.investment.findMany({
      where: {
        userId,
        buyDate: {
          gte: startDate,
          lt: new Date(endDate.setDate(endDate.getDate() + 1)),
        },
      },
    })
    res.status(200).json({ message: "Data Found", investments })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}


// �� delete Investment
export const deleteInvestment = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { id } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id

    const investment = await prisma.investment.findUnique({
      where: { id },
    })

    if (!investment || investment.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Investment not found or unauthorized",
      })
    }

    await prisma.investment.delete({
      where: { id },
    })

    res.status(200).json({
      success: true,
      message: "Investment deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    })
  }
}

// ✏️ Update Investment
export const updateInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    const data = req.body

    const payload = await investmentSchema.parse(data)
    const investment = await prisma.investment.findUnique({
      where: { id },
    })

    if (!investment || investment.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Investment not found or unauthorized",
      })
    }


    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: {
        name: payload.name,
        type: payload.type,
        amount: payload.amount,
        quantity: payload.quantity,
        buyDate: payload.buyDate,
        sellDate: payload.sellDate,
        currentValue: payload.currentValue,
      },
    })

    res.status(200).json({
      success: true,
      message: "Investment updated successfully",
      investment: updatedInvestment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    })
  }
}