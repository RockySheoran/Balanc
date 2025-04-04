/**
 * Account Controller
 *
 * Handles all account-related operations including:
 * - Creating new accounts
 * - Retrieving user accounts
 * - Deleting accounts
 * - Caching frequent queries with Redis
 *
 * @format
 * @module AccountController
 */

import { Request, Response } from "express"
import { ZodError } from "zod"
import redisClient from "../../Config/redis/redis.js"
import prisma from "../../Config/DataBase.js"
import { accountSchema } from "../../Validation/AccountValidations.js"
import { formatError } from "../../helper.js"


export const AccountController = {
  /**
   * Get all accounts for authenticated user with Redis caching
   * @param req - Express request object
   * @param res - Express response object
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
      console.log(userId+"sdff")
      const cacheKey = `accounts:${userId}`

      // Check Redis cache first
      const cachedAccounts = await redisClient.get(cacheKey)

      if (cachedAccounts) {
        return res.status(200).json({
          success: true,
          message: "Accounts retrieved from cache",
          data: JSON.parse(cachedAccounts),
        })
      }

      // If not in cache, query database
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

      // Cache the result for 1 hour
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(accounts))

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
   * Create a new account for authenticated user
   * @param req - Express request object
   * @param res - Express response object
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

      // Invalidate Redis cache for this user's accounts
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
   * Delete an account and its associated transactions
   * @param req - Express request object
   * @param res - Express response object
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

      // Verify account exists and belongs to user
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      })

      if (!account || account.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: "Account not found or unauthorized",
        })
      }

      // Delete account and its transactions in a transaction
      await prisma.$transaction([
        prisma.transaction.deleteMany({
          where: { accountId },
        }),
        prisma.account.delete({
          where: { id: accountId },
        }),
      ])

      // Invalidate Redis cache for this user's accounts
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
   * Update account information
   * @param req - Express request object
   * @param res - Express response object
   */
  // async updateAccount(req: Request, res: Response): Promise<any> {
  //   try {
  //     if (!req.user) {
  //       return res.status(401).json({
  //         success: false,
  //         message: "Unauthorized",
  //       })
  //     }

  //     const userId = req.user.id
  //     const { id } = req.params
  //     const payload = accountSchema.parse(req.body)

  //     // Verify account exists and belongs to user
  //     const account = await prisma.account.findUnique({
  //       where: { id },
  //     })

  //     if (!account || account.userId !== userId) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Account not found or unauthorized",
  //       })
  //     }

  //     // Calculate new balance if income changes
  //     let newBalance = account.balance ?? 0
  //     if (payload.income && payload.income !== account.income) {
  //       newBalance += payload.income - account.income
  //     }

  //     const updatedAccount = await prisma.account.update({
  //       where: { id },
  //       data: {
  //         name: payload.name,
  //         type: payload.type,
  //         income: payload.income,
  //         balance: newBalance,
  //         totalExpense: payload.totalExpense,
  //       },
  //     })

  //     // Invalidate Redis cache for this user's accounts
  //     await redisClient.del(`accounts:${userId}`)

  //     return res.status(200).json({
  //       success: true,
  //       message: "Account updated successfully",
  //       data: updatedAccount,
  //     })
  //   } catch (error) {
  //     console.error("Error updating account:", error)
  //     if (error instanceof ZodError) {
  //       const errors = await formatError(error)
  //       return res.status(422).json({ message: "Invalid Data", errors })
  //     }
  //     return res.status(500).json({
  //       success: false,
  //       error: (error as Error).message,
  //     })
  //   }
  // },
}
