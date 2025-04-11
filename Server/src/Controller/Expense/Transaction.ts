/**
 * Transaction Controller with Redis Caching
 * (Only Redis additions - core logic unchanged)
 *
 * @format
 */

import { Request, Response } from "express"
import { ZodError } from "zod"
import prisma from "../../Config/DataBase.js"
import { transactionSchema } from "../../Validation/TransactionsValidation.js"
import { formatError } from "../../helper.js"
import redisClient from "../../Config/redis/redis.js"

const CACHE_TTL = 3600 // 1 hour cache

export const createTransaction = async (
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

    const userId = req.user.id
    const data = req.body
    const payload = await transactionSchema.parse(data)

    const account = await prisma.account.findUnique({
      where: { id: payload.accountId },
    })

    if (!account) {
      return res.status(404).json({ message: "Account not found" })
    }

    const transaction = await prisma.transaction.create({
      data: {
        name: payload.name,
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

    if (payload.type === "CREDIT" || payload.type === "INCOME") {
      updatedBalance += payload.amount
    } else {
      updatedBalance -= payload.amount
      expense += payload.amount
    }

    const updatedAccount = await prisma.account.update({
      where: { id: payload.accountId },
      data: {
        totalExpense: expense,
        balance: updatedBalance,
      },
    })

    // Redis addition: Invalidate cache
    await redisClient.del(`transactions:${payload.accountId}`)

    return res.status(201).json({
      message: "Transaction created successfully",
      data: { transaction, balance: updatedAccount.balance },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors })
    }
    return res.status(500).json({ error: (error as Error).message })
  }
}

export const getAllTransactions = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { accountId } = req.body

    if (!accountId) {
      return res.status(400).json({ message: "Account ID is required" })
    }

    const cacheKey = `transactions:${accountId}`

    // Redis addition: Check cache first
    const cachedTransactions = await redisClient.get(cacheKey)
    if (cachedTransactions) {
      return res.status(200).json({
        message: "Transactions retrieved from cache",
        data: { transactions: JSON.parse(cachedTransactions) },
      })
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    })

    // Redis addition: Cache results
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(transactions))

    return res.status(200).json({
      message: "Transactions retrieved successfully",
      data: { transactions },
    })
  } catch (error) {
    console.error("Error retrieving transactions:", error)
    return res.status(500).json({
      message: "Error retrieving transactions",
      error: (error as Error).message,
    })
  }
}

export const deleteTransaction = async (
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

  const userId = req.user.id
    const { id } = req.body
    console.log(userId,id)

    const transaction = await prisma.transaction.findUnique({
      where: { id: id, userId: userId },
    })
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
   const updatedAccount = await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: updatedBalance,
        totalExpense: updatedTotalExpense,
      },
    })
    console.log(updatedAccount)

    // Redis addition: Invalidate cache
    await redisClient.del(`transactions:${transaction.accountId}`)

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
      data: { updatedAccount},
    })
  } catch (error) {
    res.status(404).json({ success: false, error: (error as Error).message })
  }
}

export const updateTransaction = async (
  req: Request,
  res: Response
): Promise<any> => {
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

    // Redis addition: Invalidate cache
    await redisClient.del(`transactions:${transaction.accountId}`)

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
