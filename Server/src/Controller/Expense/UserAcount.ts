/** @format */

import { Request, Response } from "express"
import prisma from "../../Config/DataBase.js"


export const AccountController = {
  /**
   * Get user account
   */
  async getUserAccount(req: Request, res: Response): Promise<any> {
    try {
         if (!req.user) {
           return res.status(401).json({
             success: false,
             message: "Unauthorized",
           })
         }
      const userId = req.user.id // Corrected from req.user.Id

      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
        },
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

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
          data: null,
        })
      }

      return res.status(200).json({
        success: true,
        message: "Account retrieved successfully",
        data: account,
      })
    } catch (error) {
      console.error("Error fetching account:", error)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
},

/**
 * Create a new account
 */
async createAccount(req: Request, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const userId = req.user.id;
      const { name, type, initialBalance = 0 } = req.body

      // Validate input
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: "Name and account type are required",
        })
      }

      const account = await prisma.account.create({
        data: {
          name,
          type,
          balance: initialBalance,
          userId,
          income: 0,
          totalExpense: 0,
        },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          createdAt: true,
        },
      })

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: account,
      })
    } catch (error) {
      console.error("Error creating account:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to create account",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}
