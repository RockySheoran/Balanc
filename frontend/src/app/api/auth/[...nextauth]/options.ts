/** @format */

import { AuthOptions, ISODateString, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import axios from "axios"
import Credentials from "next-auth/providers/credentials"
import { loginApi } from "@/lib/EndPointApi"
import GoogleProvider from "next-auth/providers/google"


export type CustomSession = {
  user?: CustomUser
  expires: ISODateString
}

export type CustomUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
  token?: string | null
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user: CustomUser }) {
      if (user) {
        token.user = user
      }
      return token
    },
    async session({
      session,
      token,
      user,
    }: {
      session: CustomSession
      token: JWT
      user: User
    }) {
      session.user = token.user as CustomUser
      return session
    },
  },
  providers: [
    Credentials({
      name: "Welcome Back",
      type: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        // console.log(credentials)
        const { data } = await axios.post(loginApi, credentials)
        const user = data?.data
        if (user) {
          return user
        } else {
          return null
        }
      },
    }),
    // ...add more providers here

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
}
