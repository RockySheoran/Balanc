/**
 * Account Controller with Redis Caching
 * (Only Redis additions - core logic unchanged)
 *
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

      // Redis addition: Check cache first
      const cachedAccounts = await redisClient.get(cacheKey)
      if (cachedAccounts) {
        return res.status(200).json({
          success: true,
          message: "Accounts retrieved from cache",
          data: JSON.parse(cachedAccounts),
        })
      }

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

      // Redis addition: Cache results
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(accounts))

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
   * Create a new account (with cache invalidation)
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

      // Redis addition: Invalidate cache
      await redisClient.del(`accounts:${userId}`)

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
   * Delete an account (with cache invalidation)
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

      const account = await prisma.account.findUnique({
        where: { id: accountId },
      })

      if (!account || account.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: "Account not found or unauthorized",
        })
      }

      await prisma.$transaction([
        prisma.transaction.deleteMany({
          where: { accountId },
        }),
        prisma.account.delete({
          where: { id: accountId },
        }),
      ])

      // Redis addition: Invalidate cache
      await redisClient.del(`accounts:${userId}`)

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
   * Update account (commented out as per original)
   */
  // async updateAccount(req: Request, res: Response): Promise<any> {
  //   ... (original commented code remains exactly the same)
  // },
}
