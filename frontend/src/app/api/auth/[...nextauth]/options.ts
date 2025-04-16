/** @format */
import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import axios from "axios"
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

interface CustomUser extends User {
  id: string
  token?: string
  provider?: string
  googleId?: string
}

interface CustomSession extends Session {
  token?: string
  user: CustomUser
}

// Enhanced environment variable handling
const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}
const api = axios.create({
  timeout: 5000,
  timeoutErrorMessage: "Request timeout",
  headers: {
    "Content-Type": "application/json",
  },
})

// Configured axios instance


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getEnvVar("GOOGLE_CLIENT_ID"),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }

          const response = await api.post(loginApi, {
            email: credentials.email,
            password: credentials.password,
          })
          

          const data = response.data
        // console.log(data+" 11111111111111111")

          if (!data.success) {
            throw new Error(data.message || "Authentication failed")
          }

          return {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            token: data.data.token,
            provider: "credentials",
          } as CustomUser
        } catch (error) {
          console.error("Credentials auth error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      // console.log(token,user,account+"2222222222222222222222222222")
      if (user && account) {
        return {
          ...token,
          accessToken: (user as CustomUser).token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: (user as CustomUser).provider || account.provider,
            googleId: (user as CustomUser).googleId,
          },
        }
      }
      return token
    },

    async session({ session, token }) {
      session.token = token.accessToken as string
      session.user = {
        ...session.user,
        ...token.user,
        id: token.user?.id as string,
      }
      // console.log(session)
      return session
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          if (!profile?.email) {
            throw new Error("No email found in Google profile")
          }

          const response = await api.post(loginGoogleApi, {
            email: profile.email,
            name: profile.name || user.name || profile.email.split("@")[0],
            image: profile.picture,
            googleId: profile.sub,
          })

          const data = response.data

          if (!data.success) {
            throw new Error(data.message || "Google authentication failed")
          }

          // Update user object with data from your API
          user.id = data.data.user.id
          user.token = data.data.token
          user.googleId = profile.sub
          user.provider = "google"
        }

        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return `/login?error=${encodeURIComponent(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "Authentication failed"
        )}`
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/register",
  },

  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60, // 10 days
  },

  jwt: {
    secret: getEnvVar("NEXTAUTH_SECRET"),
    maxAge: 10 * 24 * 60 * 60, // 10 days
  },

  secret: getEnvVar("NEXTAUTH_SECRET"),
  debug: process.env.NODE_ENV === "development",
}
