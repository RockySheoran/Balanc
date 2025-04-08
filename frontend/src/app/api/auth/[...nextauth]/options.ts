/** @format */
import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import axios, { AxiosError } from "axios"
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

// Keeping your original interfaces exactly as you had them
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

// Preserving your environment variable handling
const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Your original Google provider configuration
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
    }),

    // Your original Credentials provider configuration
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

          const { data } = await axios.post(loginApi, {
            email: credentials.email,
            password: credentials.password,
          })

          if (!data?.success || !data.data) {
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
          console.error("Credentials login error:", error)

          if (axios.isAxiosError(error)) {
            const message = error.response?.data?.error || error.message
            throw new Error(message)
          }

          throw new Error((error as Error).message || "Login failed")
        }
      },
    }),
  ],

  // Your original callbacks unchanged
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
      }
      return token
    },

    async session({ session, token }: { session: CustomSession; token: JWT }) {
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
          if (!profile?.email || !profile?.sub) {
            throw new Error(
              "Google authentication incomplete - missing profile data"
            )
          }

          const { data } = await axios.post(loginGoogleApi, {
            email: profile.email,
            name: profile.name || user.name || profile.email.split("@")[0],
            image: profile.picture || user.image,
            googleId: profile.sub,
          })

          if (!data?.success || !data.data?.token) {
            throw new Error(data?.error || "Google authentication failed")
          }

          Object.assign(user, {
            id: data.data.user.id,
            token: data.data.token,
            googleId: profile.sub,
            provider: "google",
          })

          return true
        }

        return true
      } catch (error) {
        console.error("SignIn callback error:", error)

        let errorMessage = "Authentication failed"
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error || error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        return `/login?error=${encodeURIComponent(errorMessage)}`
      }
    },
  },

  // Your original pages configuration
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login?error=true",
    verifyRequest: "/login?verify=true",
  },

  // Your original session configuration
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60, // 10 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Security settings (only changed debug to be environment-based)
  secret: getEnvVar("NEXTAUTH_SECRET"),
  useSecureCookies: process.env.NODE_ENV === "production",

  // Only change made: debug now only enabled in development
  debug: process.env.NODE_ENV === "development",
}

export default NextAuth(authOptions)
