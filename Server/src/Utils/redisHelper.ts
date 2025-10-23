/** @format */
/**
 * Redis Helper Utilities
 * Ensures all Redis operations include proper TTL
 */

import redisClient from "../Config/redis/redis.js"

const DEFAULT_TTL = 3600 // 1 hour

export class RedisHelper {
  /**
   * Set key with automatic TTL
   */
  static async setWithTTL(key: string, value: string, ttl: number = DEFAULT_TTL): Promise<void> {
    await redisClient.setEx(key, ttl, value)
  }

  /**
   * Set multiple keys with TTL using pipeline
   */
  static async setMultipleWithTTL(
    keyValuePairs: Array<{ key: string; value: string; ttl?: number }>
  ): Promise<void> {
    const multi = redisClient.multi()
    
    keyValuePairs.forEach(({ key, value, ttl = DEFAULT_TTL }) => {
      multi.setEx(key, ttl, value)
    })
    
    await multi.exec()
  }

  /**
   * Get key value
   */
  static async get(key: string): Promise<string | null> {
    return await redisClient.get(key)
  }

  /**
   * Delete keys
   */
  static async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0
    if (keys.length === 1) {
      return await redisClient.del(keys[0])
    }
    return await redisClient.del(keys)
  }

  /**
   * Check if key exists and has TTL
   */
  static async checkKeyHealth(key: string): Promise<{ exists: boolean; hasTTL: boolean; ttl: number }> {
    const exists = await redisClient.exists(key)
    const ttl = await redisClient.ttl(key)
    
    return {
      exists: exists === 1,
      hasTTL: ttl > 0,
      ttl
    }
  }

  /**
   * Ensure key has TTL (fix if missing)
   */
  static async ensureTTL(key: string, ttl: number = DEFAULT_TTL): Promise<boolean> {
    const keyTTL = await redisClient.ttl(key)
    
    if (keyTTL === -1) {
      // Key exists but has no TTL
      await redisClient.expire(key, ttl)
      return true
    }
    
    return false
  }

  /**
   * Safe cache operation with automatic TTL
   */
  static async safeCache(
    key: string, 
    data: any, 
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    const serializedData = JSON.stringify(data)
    await this.setWithTTL(key, serializedData, ttl)
  }

  /**
   * Safe cache retrieval with JSON parsing
   */
  static async safeCacheGet<T>(key: string): Promise<T | null> {
    try {
      const data = await this.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Error parsing cached data for key ${key}:`, error)
      // Delete corrupted cache
      await this.delete(key)
      return null
    }
  }
}

export default RedisHelper