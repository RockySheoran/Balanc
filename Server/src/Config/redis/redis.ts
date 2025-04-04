/** @format */

import { createClient, RedisClientType } from "redis"
import dotenv from "dotenv"

dotenv.config()

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

redisClient.on("error", (err: Error) =>
  console.error("Redis Client Error:", err)
)

;(async () => {
  await redisClient.connect()
  console.log("Connected to Redis")
})()

export default redisClient
