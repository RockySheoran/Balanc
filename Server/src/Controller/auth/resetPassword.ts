/** @format */

import { Request, Response } from "express"
import { ZodError } from "zod"
import { checkDataDiffent, formatError } from "../../helper.js"
import { reset_password_Schema } from "../../Validation/AuthValidation.js"
import prisma from "../../Config/DataBase.js"
import bcrypt from "bcrypt"



export const reset_password = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const body = req.body

    const payload = await reset_password_Schema.parse(body)

    const user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    })
    if (!user) {
      return res.status(422).json({
        message: "Invalid data",
        errors: {
          email: "No Account found with this email!",
        },
      })
    }

    if (user.password_reset_token !== payload.token) {
      return res.status(422).json({
        errors: {
          email: "Please make sure you are using correct url.",
        },
      })
    }

    // check 2 hours  time

    const diff = checkDataDiffent(user.token_send_at!)

    if (diff > 2) {
      return res.status(422).json({
        errors: {
          email:
            "Password Reset token got expire.please send new token to reset password.",
        },
      })
    }
    // * Update the password
    const salt = await bcrypt.genSalt(10)
    const newPass = await bcrypt.hash(payload.password, salt)
    await prisma.user.update({
      data: {
        password: newPass,
        password_reset_token: null,
        token_send_at: null,
      },
      where: { email: payload.email },
    })

    return res.json({
      message: "Password reset successfully! please try to login now.",
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error)
      // console.log(errors)
      return res.status(422).json({ errors: errors })
    }
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." })
  }
}
