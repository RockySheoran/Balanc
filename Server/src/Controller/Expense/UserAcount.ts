/** @format */

import { Request, Response } from "express"
import prisma from "../../Config/DataBase.js"
import { accountSchema } from "../../Validation/AccountValidations.js"
import { ZodError } from "zod"
import { formatError } from "../../helper.js"
import { json } from "stream/consumers"


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
      const userId = req.user.Id // Corrected from req.user.Id

      const account = await prisma.account.findMany({
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
        console.log(req.user)
      const userId = req.user?.Id;
      const data= req.body
      const payload = accountSchema.parse(data);
         console.log(userId)
      // Validate input
      console.log(payload)
      

      const account = await prisma.account.create({
        data: {
          name:payload.name,
          type:payload.type,
          balance:payload.income,
          userId: userId,
          income:payload.income ,
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
      // console.log(account)

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: account,
      })
    } catch (error) {
      console.error("Error creating account:", error)
      if(error instanceof ZodError ){
        const errors  = await formatError(error);
        return res.status(422).json({ message: "Invalid Data" ,errors:errors})
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create account",
        errors: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}


// Delete an account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      })
    }
    const userId = req.user?.Id

    const account = await prisma.account.findUnique({
      where: { id },
    })

    if (!account || account.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Account not found or unauthorized",
      })
    }

    await prisma.account.delete({
      where: { id },
    })

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    })
  }
}


// //! ✏️ Update Account
// export const updateAccount = async (req: Request, res: Response)   :Promise<any>=> {
//   try {
//     const { id } = req.params
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       })
//     }
//     const userId = req.user?.Id
//     const data = req.body

//     const payload = await accountSchema.parse(data)
//     const account = await prisma.account.findUnique({
//       where: { id },
//     })

//     if (!account || account.userId !== userId) {
//       return res.status(404).json({
//         success: false,
//         message: "Account not found or unauthorized",
//       })
//     }
//     let balance =  account.balance;
//     if(account.income < payload.income!){
//       balance = account.balance! + (payload.income! - account.income)
//     }else{
       
//     }


//     const updatedAccount = await prisma.account.update({
//       where: { id },
//       data: {
//         name: payload.name,
//         type: payload.type,
//         income: payload.income,
//         balance: ,
//         totalExpense: payload.totalExpense,
        
//       },
//     })

//     res.status(200).json({
//       success: true,
//       message: "Account updated successfully",
//       account: updatedAccount,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: (error as Error).message,
//     })
//   }
// }
