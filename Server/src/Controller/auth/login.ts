/** @format */

import e, { Request, Response } from "express"
import { loginSchema } from "../../Validation/AuthValidation.js"
import prisma from "../../Config/DataBase.js"

import bcrypt from "bcrypt"
import { ZodError } from "zod"
import { formatError } from "../../helper.js"
import jsonwebtoken from "jsonwebtoken"

export const Login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body
    const payload = await loginSchema.parse(req.body)
    // Check if the user already exists
    let user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    })
 if (user?.provider !== "email") {
   return res.status(401).json({
     success: false,
     error: `Please login using ${user?.provider}`,
   })
 }
    if (!user || user === null) {
      return res.status(422).json({ errors: { email: "User not found" } })
    }
    // Check if the password is correct
    const isMatch = await bcrypt.compare(payload.password, user.password!)
    if (!isMatch) {
      return res
        .status(422)
        .json({ errors: { password: "Password not correct" } })
    }
    let JWTPayload = {
      Id: user.id,
      name: user.name,
      email: user.email,
    }
    const token = jsonwebtoken.sign(JWTPayload, process.env.JWT_SECRET_KEY!, {
      expiresIn: "10d",
    })

    console.log(token)
    // Return the user data
    return res.status(200).json({
      message: "Login Successful",
      data: {
        token: `${token}`,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    })
  } catch (error) {
    console.log(error)
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors: errors })
    }
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." })
  }
}

export const Check_Login = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, password } = req.body
    const payload = await loginSchema.parse(req.body)
    // Check if the user already exists
    let user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    })
     if (user?.provider !== "email") {
       return res.status(401).json({
         success: false,
         error: `Please login using ${user?.provider}`,
       })
     }
    if (!user || user === null) {
      return res.status(422).json({ errors: { email: "User not found" } })
    }
    // Check if the password is correct
    const isMatch = await bcrypt.compare(payload.password, user.password!)
    if (!isMatch) {
      return res
        .status(422)
        .json({ errors: { password: "Password not correct" } })
    }
    // let JWTPayload = {
    //     Id : user.id,
    //     name:user.name,
    //     email:user.email
    // }
    // const token = jsonwebtoken.sign(JWTPayload,process.env.JWT_SECRET_KEY!,{expiresIn:"10d"})

    // Return the user data
    return res.status(200).json({
      message: "Login Successful",
      data: {
        // id:user.id,
        // name:user.name,
        // email:user.email,
        // token:token
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error)
      return res.status(422).json({ message: "Invalid Data", errors: errors })
    }
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again." })
  }
}
