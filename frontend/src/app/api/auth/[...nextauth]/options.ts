/** @format */
import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

// Cache configuration
const CACHE_TTL = 60 * 5 // 5 minutes cache

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

// Enhanced environment variable handling with error caching
const envCache: Record<string, string> = {}
const getEnvVar = (key: string): string => {
  if (envCache[key]) return envCache[key]
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  envCache[key] = value
  return value
}

// Configured axios instance with better error handling
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: { "Content-Type": "application/json" },
})

// Add response interceptor for consistent error handling
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle HTTP errors
      return Promise.reject(
        new Error(
          error.response.data?.error ||
            error.response.data?.message ||
            "Authentication failed"
        )
      )
    } else if (error.request) {
      // Handle no response errors
      return Promise.reject(new Error("Network error - no response received"))
    }
    // Handle other errors
    return Promise.reject(error)
  }
)

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

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }

          const { data } = await authApi.post(loginApi, {
            email: credentials.email,
            password: credentials.password,
          })

          if (!data?.success) {
            throw new Error(data?.error || "Authentication failed")
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
          throw new Error(
            axios.isAxiosError(error)
              ? error.message
              : "Invalid credentials. Please try again."
          )
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: (user as CustomUser)?.provider || account?.provider,
          googleId: (user as CustomUser)?.googleId,
        }
        token.token = (user as CustomUser)?.token
        token.iat = Math.floor(Date.now() / 1000)
        token.exp = Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60 // 10 days
      }
      return token
    },

    async session({ session, token }) {
      session.token = token.token as string
      session.user = {
        ...session.user,
        ...token.user,
        id: token.user?.id as string,
        token: token.token as string,
      }
      return session
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          if (!profile?.email) {
            throw new Error("Google authentication incomplete - no email found")
          }

          const { data } = await authApi.post(loginGoogleApi, {
            email: profile.email,
            name: profile.name || user.name || profile.email.split("@")[0],
            image: profile.picture,
            googleId: profile.sub,
          })

          if (!data?.success) {
            throw new Error(data?.error || "Google authentication failed")
          }

          Object.assign(user, {
            id: data.data.user.id,
            token: data.data.token,
            googleId: profile.sub,
            provider: "google",
          })
        }
        return true
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : error instanceof Error
          ? error.message
          : "Authentication failed"

        return `/login?error=${encodeURIComponent(errorMessage)}`
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // Unified error page
    newUser: "/register", // Optional: for new user registration
  },

  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60, // 10 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: getEnvVar("NEXTAUTH_SECRET"),
    maxAge: 10 * 24 * 60 * 60, // 10 days
  },

  secret: getEnvVar("NEXTAUTH_SECRET"),
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
}

export default NextAuth(authOptions)
