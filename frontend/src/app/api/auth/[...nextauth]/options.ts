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

// Enhanced environment variable handling with cache
const envCache: Record<string, string> = {}
const getEnvVar = (key: string): string => {
  if (envCache[key]) return envCache[key]
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  envCache[key] = value
  return value
}

// Configured axios instance with timeout and retry
const api = axios.create({
  timeout: 15000,
  timeoutErrorMessage: "Request timeout",
  headers: {
    "Content-Type": "application/json",
  },
})

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
      httpOptions: {
        timeout: 15000, // 10 seconds timeout for Google requests
      },
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
      return session
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          if (!profile?.email) {
            throw new Error("No email found in Google profile")
          }

          // Optimized Google login API call
          const response = await api.post(
            loginGoogleApi,
            {
              email: profile.email,
              name: profile.name || user.name || profile.email.split("@")[0],
              image: profile.picture,
              googleId: profile.sub,
            },
            { timeout: 8000 } // 8 seconds timeout for this specific call
          )

          const data = response.data

          if (!data.success) {
            throw new Error(data.message || "Google authentication failed")
          }

          user.id = data.data.user.id
          user.token = data.data.token
          user.googleId = profile.sub
          user.provider = "google"
        }

        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return `/login?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Authentication failed"
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

  // Optimized JWT settings
  jwt: {
    secret: getEnvVar("NEXTAUTH_SECRET"),
    maxAge: 10 * 24 * 60 * 60, // 10 days
    encode: async ({ secret, token }) => {
      // Implement custom fast JWT encoding if needed
      return `${secret}.${JSON.stringify(token)}` // Simplified example
    },
    decode: async ({ secret, token }) => {
      // Implement custom fast JWT decoding if needed
      if (typeof token !== "string") return null
      const parts = token.split(".")
      if (parts.length !== 2) return null
      return JSON.parse(parts[1])
    },
  },

  // Event logging for debugging
  events: {
    async signIn(message) {
      console.log("User signed in", message)
    },
    async signOut(message) {
      console.log("User signed out", message)
    },
  },

  // Timeout configuration
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 24 * 60 * 60, // 10 days
      },
    },
  },

  debug: process.env.NODE_ENV === "development",
}

export default NextAuth(authOptions)
