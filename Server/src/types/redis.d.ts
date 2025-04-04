/** @format */

import { RedisClientType } from "redis"

declare module "express-session" {
  interface SessionData {
    userId?: string
    // Add your custom session properties here
  }
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>
    }
  }
}

export type RedisClient = RedisClientType
