/** @format */


import { RedisClientType } from "redis"
import redisClient from "../Config/redis/redis.js"

class RedisService {
  private client: RedisClientType

  constructor() {
    this.client = redisClient
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, JSON.stringify(value))
    } else {
      await this.client.set(key, JSON.stringify(value))
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key)
  }

  async flush(): Promise<void> {
    await this.client.flushDb()
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.client.expire(key, seconds)
  }
}

export default new RedisService()
