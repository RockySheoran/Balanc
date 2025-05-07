/**
 * Handles Google OAuth authentication
 *
 * @format
 */
import { Request, Response } from "express"
import { loginSchema } from "../../Validation/AuthValidation.js"
import prisma from "../../Config/DataBase.js"
import bcrypt from "bcrypt"
import { ZodError } from "zod"
import { formatError } from "../../helper.js"
import jwt from "jsonwebtoken"


export const handleGoogleAuth = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, name, image, googleId } = req.body

    // Validate required fields
    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Email and Google ID are required",
      })
    }

    // Check for existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    })
    // console.log(user)

    // Handle new user registration
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image,
          googleId,
          provider: "google",
          verified: true,
        },
      })
      return sendAuthResponse(res, user, true)
    }

    // Handle case where email exists but with different provider
    if (user.provider !== "google") {
      return res.status(400).json({
        success: false,
        error: `This email is already registered with ${user.provider}`,
      })
    }

    // Update existing user profile if needed
    if (!user.googleId || name !== user.name || image !== user.image) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          image: image || user.image,
          googleId: googleId || user.googleId,
          provider: "google",
        },
      })
    }

    return sendAuthResponse(res, user, false)
  } catch (error) {
    console.error("Google auth error:", error)
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    })
  }
}

/**
 * Helper function to send authentication response
 */
const sendAuthResponse = (
  res: Response,
  user: any,
  isNewUser: boolean
): Response => {
    let JWTPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
    }
   const token = jwt.sign(JWTPayload, process.env.JWT_SECRET_KEY!, {
        expiresIn: "5d",
      })
  

  // console.log(token)



  
  return res.json({
    success: true,
    isNewUser,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        provider: user.provider,
        verified: user.verified,
      },
    },
  })
}
