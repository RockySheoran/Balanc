/** @format */

// src/controllers/transactionController.ts
import { PrismaClient } from "@prisma/client"
import { Request, Response } from "express"
import { ZodError } from "zod"
import { formatError } from "../../helper.js"
import { transactionSchema } from "../../Validation/TransactionsValidation.js"

const prisma = new PrismaClient()

// 🎯 Create a Transaction
export const createTransaction = async (req: Request, res: Response) :Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    //   console.log(req.user)
    const userId = req.user?.Id
    const data = req.body
    const payload = await transactionSchema.parse(data)
     const account = await prisma.account.findUnique({
       where: {
         id: payload.accountId,
       },
     })

     if (!account) {
       return res.status(404).json({ message: "Account not found" })
     }

    const transaction = await prisma.transaction.create({
      data: {
        accountId: payload.accountId,
        userId,
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        description: payload.description,
      },
    })
let updatedBalance = account.balance || 0

if (payload.type === "CREDIT") {
  updatedBalance += payload.amount
} else  {
  updatedBalance -= payload.amount
}

// Update the account balance
await prisma.account.update({
  where: {
    id: payload.accountId,
  },
  data: {
    balance: updatedBalance,
  },
})
    res
      .status(201)
      .json({ message: "Transaction created successfully", transaction })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors: errors })
    }
    res.status(500).json({ error: (error as Error).message })
  }
}

// 🎯 Get All Transactions
export const getAllTransactions = async (req: Request, res: Response) :Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.Id
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
    })
    res.status(200).json(transactions)
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Transaction not found",
        error: (error as Error).message,
      })
  }
}

// 🎯 Get Transactions by Date

// 🎯 Get Transactions by Date
export const getTransactionsByDate = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { date } = req.params

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }

    const userId = req.user?.Id

    // Parse and set date range to match full day
    const startDate = new Date(date)
    startDate.setUTCHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setUTCHours(23, 59, 59, 999)

    // Fetch transactions within date range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    res.status(200).json({ message: "Data Found", transactions })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Data not Found", error: (error as Error).message })
  }
}

// 🎯 Get Transactions by Month
export const getTransactionsByMonth = async (req: Request, res: Response) :Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.Id
    const { year, month } = req.params
    const startDate = new Date(`${year}-${month}-01`)
    const endDate = new Date(`${year}-${Number(month) + 1}-01`)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    })
    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// 🎯 Get Transactions by Year
export const getTransactionsByYear = async (req: Request, res: Response) :Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.Id
    const { year } = req.params
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${Number(year) + 1}-01-01`)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    })
    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
