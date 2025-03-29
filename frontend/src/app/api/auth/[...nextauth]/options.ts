/** @format */
import NextAuth, { type NextAuthOptions, type User } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import axios, { AxiosError } from "axios"
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

// Extended interfaces for custom user and session
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

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),

    // Credentials Provider for email/password login
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

          const response = await axios.post(loginApi, {
            email: credentials.email,
            password: credentials.password,
          })

          if (!response.data?.success || !response.data.data) {
            throw new Error(response.data?.error || "Authentication failed")
          }

          return {
            id: response.data.data.user.id,
            name: response.data.data.user.name,
            email: response.data.data.user.email,
            token: response.data.data.token,
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

  callbacks: {
    // JWT callback - runs whenever a JWT is created or updated
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: user?.provider || account?.provider,
          googleId: user?.googleId,
        }
        token.token = user.token
      }
      return token
    },

    // Session callback - controls what's returned to the client session
    async session({ session, token }: { session: CustomSession; token: JWT }) {
      session.token = token.token as string
      session.user = {
        ...session.user,
        ...token.user,
        id: token?.user?.id as string,
        token: token.token as string,
      }
      return session
    },

    // SignIn callback - handles custom sign-in logic
    async signIn({ user, account, profile }) {
      try {
        // Handle Google OAuth flow
        if (account?.provider === "google") {
          if (!profile?.email || !profile?.sub) {
            throw new Error("Google authentication incomplete")
          }

          const response = await axios.post(loginGoogleApi, {
            email: profile.email,
            name: profile.name || profile.email.split("@")[0],
            image: profile.image,
            googleId: profile.sub,
          })

          if (!response.data?.success || !response.data.data?.token) {
            throw new Error(
              response.data?.error || "Google authentication failed"
            )
          }

          // Augment the user object with additional data
          Object.assign(user, {
            id: response.data.data.user.id,
            token: response.data.data.token,
            googleId: profile.sub,
            provider: "google",
          })

          return true
        }

        // For credentials provider, just continue
        return true
      } catch (error) {
        console.error("SignIn callback error:", error)

        let errorMessage = "Authentication failed"
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.error || error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        // Redirect to login page with error message
        return `/login?error=${encodeURIComponent(errorMessage)}`
      }
    },
  },

  // Custom pages
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login?error=true",
    verifyRequest: "/login?verify=true",
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60, // 10 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Security
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",

  // Debugging
  debug: process.env.NODE_ENV === "development",
}

export default NextAuth(authOptions)
