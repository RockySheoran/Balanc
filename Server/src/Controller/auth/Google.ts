/** @format */
// src/controllers/auth.controller.ts
import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import prisma from "../../Config/DataBase.js"

const JWT_SECRET = process.env.JWT_SECRET_KEY as string
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d"

// Helper function to send authentication response
const sendAuthResponse = (res: Response, user: any, isNewUser: boolean) => {
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return res.json({
    success: true,
    token,
    isNewUser,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      provider: user.provider,
      verified: user.verified,
    },
  })
}

// Handle Google OAuth registration/login
export const handleGoogleAuth = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { email, name, image, googleId } = req.body
    // console.log(email, name, image, googleId)

    // Validate required fields
    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Email and Google ID are required",
      })
    }

    // Check for existing user by googleId first (preferred)
    let user = await prisma.user.findFirst({
      where: { googleId },
    })

    // If no user found by googleId, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      })
    }

    // Handle new user registration
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          googleId,
          provider: "google",
          verified: true,
        },
      })

      return sendAuthResponse(res, user, true)
    }

    // Handle existing user cases
    if (user.provider !== "google") {
      return res.status(400).json({
        success: false,
        error: "This email is already registered with another method",
      })
    }

    // Update existing user's profile if needed
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        image: image || user.image,
      },
    })

    return sendAuthResponse(res, updatedUser, false)
  } catch (error) {
    console.error("Google auth error:", error)
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    })
  }
}
