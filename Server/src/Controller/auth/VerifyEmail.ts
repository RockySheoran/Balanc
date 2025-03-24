/** @format */

import { Request, Response } from "express"
import { promises } from "fs"
import prisma from "../../Config/DataBase.js"

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email, token } = req.query
  if (email && token) {
    const user = await prisma.user.findUnique({
      where: {
        email: email as string,
      },
    })
    if (user) {
      if (token === user.email_verify_token) {
        // redirect user to front page
        await prisma.user.update({
          data: {
            email_verify_token: null,
            email_verified_at : new Date().toISOString(),
          },
          where: {
            email: email as string,
          },
        })
        return res.redirect(`${process.env.CLIENT_APP_URL}/login`)
      }
    }

    return res.redirect("/verify-error")
  }
  return res.redirect("/verify-error")
}

export const verifyError = async (
  req: Request,
  res: Response
): Promise<any> => {
  return res.render("auth/verifyEmailError")
}
