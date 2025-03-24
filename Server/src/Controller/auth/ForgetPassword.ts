/** @format */

import { Request, Response } from "express"
import { forgetPasswordSchema } from "../../Validation/AuthValidation.js"
import { ZodError } from "zod"
import { formatError, renderEmailEjs } from "../../helper.js"
import prisma from "../../Config/DataBase.js"
import bcrypt from "bcrypt"
import { v4 as uuid4 } from "uuid"
import { emailQueue, emailQueueName } from "../../Job/emailJob.js"

export const forgetPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  const body = req.body
  try {
    const payload = await forgetPasswordSchema.parse(body)

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

    const salt = await bcrypt.genSalt(10)
    const token = await bcrypt.hash(uuid4(), salt)

    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        passwordResetToken: token,
        tokenSendAt: new Date().toISOString(),
      },
    })

    const url = `${process.env.CLIENT_APP_URL}/reset-password?email=${payload.email}&token=${token}`;
   const bodyHtml = await renderEmailEjs("forget-password", { name: user.name, url: url });

   await emailQueue.add(emailQueueName, { to: payload.email, subject: "Password Reset", html: bodyHtml });

    return res.status(200).json({
      message: "Email sent successfully,Please check your email",
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
