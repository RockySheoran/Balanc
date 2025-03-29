/** @format */
import { AuthOptions, ISODateString, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import axios from "axios"
import Credentials from "next-auth/providers/credentials"
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi"
import GoogleProvider from "next-auth/providers/google"

export type CustomSession = {
  user?: CustomUser
  expires: ISODateString
  token?: string
}

export type CustomUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
  token?: string | null
  googleId?: string | null
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google sign-in
      if (account?.provider === "google") {
        try {
          // Register or authenticate user with your backend
          const response = await axios.post(loginGoogleApi, {
            email: profile?.email,
            name: profile?.name,
            image: profile?.image || "",
            googleId: profile?.sub,
          })

          // Merge backend user data with NextAuth user
          if (response.data?.token) {
            (user as CustomUser).token = response.data.token
            user.id = response.data.user.id
          }
          return true
        } catch (error) {
          console.error("Google sign-in error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      // Persist user data and token to the JWT
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          token: user.token,
          googleId: user.googleId,
        }
      }
      return token
    },
    async session({ session, token }) {
      // Send user properties to the client
      session.user = token.user as CustomUser
      session.token = token.user?.token
      return session
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        try {
          const { data } = await axios.post(loginApi, {
            email: credentials?.email,
            password: credentials?.password,
          })

          if (!data?.data) {
            throw new Error("Invalid credentials")
          }

          return {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            token: data.data.token,
          }
        } catch (error) {
          console.error("Credentials authorization error:", error)
          return null
        }
      },
    }),
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
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
