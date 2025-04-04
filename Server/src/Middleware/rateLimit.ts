/** @format */

import { Request, Response, NextFunction, AsyncRequestHandler } from "express"
import redisService from "../Service/redis.service.js"


const rateLimit = (
  limit: number = 100,
  windowInSeconds: number = 60
): AsyncRequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${req.ip}`

    try {
      const current = await redisService.incr(key)

      if (current === 1) {
        await redisService.expire(key, windowInSeconds)
      }

      if (current > limit) {
        res.status(429).json({
          error: "Too many requests",
          retryAfter: windowInSeconds,
        })
        return
      }

      next()
    } catch (err) {
      console.error("Rate limit error:", err)
      next()
    }
  }
}

export default rateLimit
