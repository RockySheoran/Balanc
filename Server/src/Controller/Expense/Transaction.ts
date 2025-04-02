/** @format */

// src/controllers/transactionController.ts

import { Request, Response } from "express"
import { ZodError } from "zod"
import { formatError } from "../../helper.js"
import { transactionSchema } from "../../Validation/TransactionsValidation.js"
import prisma from "../../Config/DataBase.js"



//! 🎯 Create a Transaction
export const createTransaction = async (
  req: Request,
  res: Response
): Promise<any>=> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.id
    // console.log(userId)
    const data = req.body
    // console.log(data)
    const payload = await transactionSchema.parse(data)
console.log(payload)
    const account = await prisma.account.findUnique({
      where: { id: payload.accountId },
    })

    if (!account) {
      return res.status(404).json({ message: "Account not found" })
    }

    const transaction = await prisma.transaction.create({
      data: {
        name:payload.name,
        accountId: payload.accountId,
        userId,
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        description: payload.description || "",
      },
    })

    let updatedBalance = account.balance || 0
    let expense = account.totalExpense || 0

    console.log(updatedBalance, expense)

    if (payload.type === "CREDIT" || payload.type === "INCOME") {
      updatedBalance += payload.amount
    } else {
      updatedBalance -= payload.amount
      expense += payload.amount
    }
    console.log(updatedBalance,expense)

    const newaccount = await prisma.account.update({
      where: { id: payload.accountId },
      data: {
        totalExpense: expense,
        balance: updatedBalance,
      },
    })
    console.log(newaccount)
console.log(transaction)
    res.status(201).json({
      message: "Transaction created successfully",
      data: { transaction },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors })
    }
   return res.status(500).json({ error: (error as Error).message })
  }
}

//! 🎯 Get All Transactions
export const getAllTransactions = async (req: Request, res: Response) : Promise<any> => {
  try {

    const { accountId } = req.body
    console.log(accountId)
    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: {
        createdAt: "desc", // Optional: sort by creation date
      },
    })
    console.log(transactions)
    console.log("dddddddddddddd")
    res.status(200).json({
      message: "Transactions retrieved successfully",
      data: { transactions },
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Error retrieving transactions",
      error: (error as Error).message,
    })
  }
}

//! 🎯 Get Transactions by Date
export const getTransactionsByDate = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { date } = req.params
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    const userId = req.user?.id
    const startDate = new Date(date)
    startDate.setUTCHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setUTCHours(23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    res.status(200).json({ message: "Data Found", transactions })
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving data",
      error: (error as Error).message,
    })
  }
}

//! 🎯 Get Transactions by Month
export const getTransactionsByMonth = async (req: Request, res: Response) : Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    const userId = req.user?.id
    const { year, month } = req.params
    const startDate = new Date(`${year}-${month}-01`)
    const endDate = new Date(`${year}-${Number(month) + 1}-01`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lt: endDate },
      },
    })

    res.status(200).json({ transactions })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

//! 🎯 Get Transactions by Year
export const getTransactionsByYear = async (req: Request, res: Response) : Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    const userId = req.user?.id
    const { year } = req.params
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${Number(year) + 1}-01-01`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lt: endDate },
      },
    })

    res.status(200).json({ transactions })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

//! ❌ Delete Transaction
export const deleteTransaction = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { id } = req.params
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    const userId = req.user?.id

    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction || transaction.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or unauthorized",
      })
    }

    const account = await prisma.account.findUnique({
      where: { id: transaction.accountId },
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      })
    }

    let updatedBalance = account.balance || 0
    let updatedTotalExpense = account.totalExpense || 0

    if (transaction.type === "CREDIT" || "INCOME") {
      updatedBalance -= transaction.amount
    } else {
      updatedBalance += transaction.amount
      updatedTotalExpense -= transaction.amount
    }

    await prisma.transaction.delete({ where: { id } })
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: updatedBalance,
        totalExpense: updatedTotalExpense,
      },
    })

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
}

//! ✏️ Update Transaction
export const updateTransaction = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { id } = req.params
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    const userId = req.user?.id
    const data = req.body
    const payload = await transactionSchema.parse(data)

    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction || transaction.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or unauthorized",
      })
    }

    const account = await prisma.account.findUnique({
      where: { id: transaction.accountId },
    })
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" })
    }

    let updatedBalance = account.balance || 0
    let updatedTotalExpense = account.totalExpense || 0

    if (transaction.type === "CREDIT") {
      updatedBalance -= transaction.amount
    } else {
      updatedBalance += transaction.amount
      updatedTotalExpense -= transaction.amount
    }

    if (payload.type === "CREDIT") {
      updatedBalance += payload.amount
    } else {
      updatedBalance -= payload.amount
      updatedTotalExpense += payload.amount
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: payload.accountId,
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        description: payload.description,
      },
    })

    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: updatedBalance,
        totalExpense: updatedTotalExpense,
      },
    })

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors })
    }
    res.status(500).json({ success: false, error: (error as Error).message })
  }
}
