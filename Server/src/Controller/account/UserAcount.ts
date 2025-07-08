/**
 * Account Controller with Redis Caching
 * @format
 */

import { Request, Response } from "express"
import { ZodError } from "zod"
import prisma from "../../Config/DataBase.js"
import { accountSchema } from "../../Validation/AccountValidations.js"
import { formatError } from "../../helper.js"
import redisClient from "../../Config/redis/redis.js"

const CACHE_TTL = 3600 // 1 hour cache

export const AccountController = {
  /**
   * Get all accounts with Redis caching
   */
  async getUserAccount(req: Request, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
      }

      const userId = req.user.id
      const cacheKey = `accounts:${userId}`

      // Check cache first
      const cachedAccounts = await redisClient.get(cacheKey)
      if (cachedAccounts) {
        return res.status(200).json({
          success: true,
          message: "Accounts retrieved from cache",
          data: JSON.parse(cachedAccounts),
        })
      }

      // Fetch from database if not in cache
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
          income: true,
          totalExpense: true,
          createdAt: true,
        },
      })

      if (!accounts || accounts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No accounts found. Please create account",
          data: null,
        })
      }

      // Cache results with transaction for reliability
      const multi = redisClient.multi()
      multi.set(cacheKey, JSON.stringify(accounts))
      multi.expire(cacheKey, CACHE_TTL)
      await multi.exec()

      return res.status(200).json({
        success: true,
        message: "Accounts retrieved successfully",
        data: accounts,
      })
    } catch (error) {
      console.error("Error fetching accounts:", error)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  /**
   * Create a new account with cache invalidation
   */
  async createAccount(req: Request, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
      }

      const userId = req.user.id
      const payload = accountSchema.parse(req.body)

      // Create account in database
      const account = await prisma.account.create({
        data: {
          name: payload.name,
          type: payload.type,
          balance: payload.income,
          userId,
          income: payload.income,
          totalExpense: 0,
        },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          createdAt: true,
          income: true,
          totalExpense: true,
        },
      })

      // Invalidate cache and update in single transaction
      const cacheKey = `accounts:${userId}`
      const multi = redisClient.multi()
      multi.del(cacheKey)

      // Optionally update cache immediately with new data
      const currentAccounts = await prisma.account.findMany({
        where: { userId },
      })
      if (currentAccounts.length > 0) {
        multi.set(cacheKey, JSON.stringify(currentAccounts))
        multi.expire(cacheKey, CACHE_TTL)
      }

      await multi.exec()

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: account,
      })
    } catch (error) {
      console.error("Error creating account:", error)
      if (error instanceof ZodError) {
        const errors = await formatError(error)
        return res.status(422).json({ message: "Invalid Data", errors })
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create account",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  /**
   * Delete an account with cache invalidation
   */
  async deleteAccount(req: Request, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
      }

      const userId = req.user.id
      const { accountId } = req.body

      // Verify account ownership
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      })

      if (!account || account.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: "Account not found or unauthorized",
        })
      }

      // Delete account and related data in transaction
      await prisma.$transaction([
        prisma.transaction.deleteMany({
          where: { accountId },
        }),
        prisma.investment.deleteMany({
          where: { accountId },
        }),
        prisma.account.deleteMany({
          where: { id: accountId },
        }),
      ])

      // Invalidate cache and optionally update with fresh data
      const cacheKey = `accounts:${userId}`
      const multi = redisClient.multi()
      multi.del(cacheKey)

      const remainingAccounts = await prisma.account.findMany({
        where: { userId },
      })
      if (remainingAccounts.length > 0) {
        multi.set(cacheKey, JSON.stringify(remainingAccounts))
        multi.expire(cacheKey, CACHE_TTL)
      }

      await multi.exec()

      return res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      })
    }
  },

  /**
   * Update account with cache invalidation
   */
  async updateAccount(req: Request, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
      }

      const userId = req.user.id
      const { accountId, ...updateData } = req.body

      // Verify account ownership
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      })

      if (!account || account.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: "Account not found or unauthorized",
        })
      }

      // Update account in database
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: updateData,
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          createdAt: true,
          income: true,
          totalExpense: true,
        },
      })

      // Invalidate cache and update with fresh data
      const cacheKey = `accounts:${userId}`
      const multi = redisClient.multi()
      multi.del(cacheKey)

      const currentAccounts = await prisma.account.findMany({
        where: { userId },
      })
      multi.set(cacheKey, JSON.stringify(currentAccounts))
      multi.expire(cacheKey, CACHE_TTL)

      await multi.exec()

      return res.status(200).json({
        success: true,
        message: "Account updated successfully",
        data: updatedAccount,
      })
    } catch (error) {
      console.error("Error updating account:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to update account",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}
