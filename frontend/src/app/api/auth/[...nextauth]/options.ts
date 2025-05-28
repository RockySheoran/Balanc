/** @format */
import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";
import { loginApi, loginGoogleApi } from "@/lib/EndPointApi";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// 1. Enhanced Types
interface CustomUser extends User {
  id: string;
  token?: string;
  provider?: string;
  googleId?: string;
  initialTokenTime?: number;
}

interface CustomSession extends Session {
  token?: string;
  user: CustomUser;
}

interface CustomJWT extends JWT {
  user?: CustomUser;
  initialTokenTime?: number;
  accessToken?: string;
}

// 2. Environment Variables
const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

// 3. Session Duration (5 days in seconds)
const SESSION_DURATION = 5 * 24 * 60 * 60;

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
            throw new Error("Email and password are required");
          }

          const response = await axios.post(
            loginApi,
            {
              email: credentials.email,
              password: credentials.password,
            },
            { timeout: 60000 }
          );

          const data = response.data;

          if (!data.success) {
            throw new Error(data.message || "Authentication failed");
          }

          return {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            token: data.data.token,
            provider: "credentials",
            initialTokenTime: Math.floor(Date.now() / 1000), // Track initial login time
          } as CustomUser;
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        return {
          ...token,
          accessToken: (user as CustomUser).token,
          initialTokenTime: (user as CustomUser).initialTokenTime || Math.floor(Date.now() / 1000),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: (user as CustomUser).provider || account.provider,
            googleId: (user as CustomUser).googleId,
          },
        } as CustomJWT;
      }

      // Return previous token if not expired
      if (token.initialTokenTime) {
        const now = Math.floor(Date.now() / 1000);
        if (now - token.initialTokenTime < SESSION_DURATION) {
          return token;
        }
      }

      // Token expired
      return { ...token, expired: true };
    },

    async session({ session, token }) {
      if (token.expired) {
        throw new Error("Session expired");
      }

      session.token = token.accessToken as string;
      session.user = {
        ...session.user,
        ...token.user,
        id: token.user?.id as string,
      };
      return session as CustomSession;
    },

    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          if (!profile?.email) {
            throw new Error("No email found in Google profile");
          }

          const response = await axios.post(
            loginGoogleApi,
            {
              email: profile.email,
              name: profile.name || user.name || profile.email.split("@")[0],
              image: profile.picture,
              googleId: profile.sub,
            },
            { timeout: 60000 }
          );

          const data = response.data;

          if (!data.success) {
            throw new Error(data.message || "Google authentication failed");
          }

          // Update user object with data from your API
          user.id = data.data.user.id;
          user.token = data.data.token;
          user.googleId = profile.sub;
          user.provider = "google";
          user.initialTokenTime = Math.floor(Date.now() / 1000);
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return `/login?error=${encodeURIComponent(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "Authentication failed"
        )}`;
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
    maxAge: SESSION_DURATION,
  },

  jwt: {
    secret: getEnvVar("NEXTAUTH_SECRET"),
    maxAge: SESSION_DURATION,
  },

  secret: getEnvVar("NEXTAUTH_SECRET"),
};
