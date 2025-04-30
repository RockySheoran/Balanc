/**
 * Transaction Controller with Redis Caching
 * @format
 */

import { Request, Response } from "express"
import { ZodError } from "zod"
import prisma from "../../Config/DataBase.js"
import { transactionSchema } from "../../Validation/TransactionsValidation.js"
import { formatError } from "../../helper.js"
import redisClient from "../../Config/redis/redis.js"

const CACHE_TTL = 3600 // 1 hour cache

export const TransactionController = {
  /**
   * Create transaction with cache invalidation
   */
  async createTransaction(req: Request, res: Response): Promise<any> {
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

      // Create transaction
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

      // Update account balance
      let updatedBalance = account.balance || 0
      let expense = account.totalExpense || 0
      let income = account.income || 0

      if (payload.type === "CREDIT" || payload.type === "INCOME") {
        updatedBalance += payload.amount
        income += payload.amount
      } else {
        updatedBalance -= payload.amount
        expense += payload.amount
      }

      const updatedAccount = await prisma.account.update({
        where: { id: payload.accountId },
        data: {
          totalExpense: expense,
          balance: updatedBalance,
          income:income
        },
      })

      // Invalidate relevant caches
      const multi = redisClient.multi()
      multi.del(`accounts:${userId}`)
      multi.del(`transactions:${payload.accountId}`)
      await multi.exec()

      return res.status(201).json({
        message: "Transaction created successfully",
        data: { transaction, updatedAccount },
      })
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = await formatError(error)
        return res.status(422).json({ message: "Invalid Data", errors })
      }
      return res.status(500).json({ error: (error as Error).message })
    }
  },

  /**
   * Get all transactions with Redis caching
   */
  async getAllTransactions(req: Request, res: Response): Promise<any> {
    try {
      const { accountId } = req.body

      if (!accountId) {
        return res.status(400).json({ message: "Account ID is required" })
      }

      const cacheKey = `transactions:${accountId}`

      // Check cache first
      const cachedTransactions = await redisClient.get(cacheKey)
      if (cachedTransactions) {
        return res.status(200).json({
          message: "Transactions retrieved from cache",
          data: { transactions: JSON.parse(cachedTransactions) },
        })
      }

      // Fetch from database if not in cache
      const transactions = await prisma.transaction.findMany({
        where: { accountId },
        orderBy: { createdAt: "desc" },
      })

      // Cache results with transaction for reliability
      const multi = redisClient.multi()
      multi.set(cacheKey, JSON.stringify(transactions))
      multi.expire(cacheKey, CACHE_TTL)
      await multi.exec()

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
  },

  /**
   * Delete transaction with cache invalidation
   */
  async deleteTransaction(req: Request, res: Response): Promise<any> {
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
      // Verify transaction ownership
      const transaction = await prisma.transaction.findUnique({
        where: { id, userId },
      })
      console.log(transaction)

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found or unauthorized",
        })
      }

      // Get related account
      const account = await prisma.account.findUnique({
        where: { id: transaction.accountId },
      })
      // console.log(account)

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        })
      }

      // Calculate new balances
      let updatedBalance = account.balance || 0
      let updatedTotalExpense = account.totalExpense || 0
      let income  = account.income || 0

      if (transaction.type === "CREDIT" || transaction.type === "INCOME") {
        updatedBalance -= transaction.amount
        income -= transaction.amount
      } else {
        updatedBalance += transaction.amount
        updatedTotalExpense -= transaction.amount
      }

      // Delete transaction and update account
      await prisma.transaction.delete({ where: { id } })
      const updatedAccount = await prisma.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: updatedBalance,
          totalExpense: updatedTotalExpense,
          income:income
        },
      })

      // Invalidate relevant caches
      const multi = redisClient.multi()
      multi.del(`transactions:${transaction.accountId}`)
      multi.del(`accounts:${userId}`)
      await multi.exec()

      return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
        data: { updatedAccount },
      })
    } catch (error) {
      console.log(error)
      return res
        .status(404)
        .json({ success: false, error: (error as Error).message })
    }
  },

  /**
   * Update transaction with cache invalidation
   */
  async updateTransaction(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" })
      }

      const userId = req.user.id
      const data = req.body
      console.log(data,userId)
      const payload = await transactionSchema.parse(data)
console.log(payload)
      // Verify transaction ownership
      const transaction = await prisma.transaction.findUnique({ where: { id :payload.id } })
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found or unauthorized",
        })
      }

      // Get related account
      const account = await prisma.account.findUnique({
        where: { id: transaction.accountId },
      })
      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: "Account not found" })
      }

      // Calculate balance adjustments
      let updatedBalance = account.balance || 0
      let updatedTotalExpense = account.totalExpense || 0
      let income = account.income || 0
console.log(updatedBalance,updatedTotalExpense,income)  
      // Reverse old transaction impact
      if (transaction.type === "CREDIT" || transaction.type === "INCOME") {
        updatedBalance -= transaction.amount
        income -= transaction.amount
      } else {
        updatedBalance += transaction.amount
        updatedTotalExpense -= transaction.amount

      }

      // Apply new transaction impact
      if (payload.type === "CREDIT" || payload.type === "INCOME") {
        updatedBalance += payload.amount
        income += payload.amount
      } else {
        updatedBalance -= payload.amount
        updatedTotalExpense += payload.amount
      }

      // Update transaction and account
      const updatedTransaction = await prisma.transaction.update({
        where: { id :payload.id },
        data: {
          accountId: payload.accountId,
          amount: payload.amount,
          type: payload.type,
          category: payload.category,
          description: payload.description,
        },
      })

    const  updatedAccount = await prisma.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: updatedBalance,
          totalExpense: updatedTotalExpense,
          income:income
        },
      })
console.log(updatedAccount)
      // Invalidate relevant caches
      const multi = redisClient.multi()
      multi.del(`transactions:${transaction.accountId}`)
      multi.del(`accounts:${userId}`)
      await multi.exec()

      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: {updatedTransaction,updatedAccount}
      })
    } catch (error) {
      console.log(error)
      if (error instanceof ZodError) {
        const errors = await formatError(error)
        return res.status(422).json({ message: "Invalid Data", errors })
      }
      return res
        .status(500)
        .json({ success: false, error: (error as Error).message })
    }
  },
}
