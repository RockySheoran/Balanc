/** @format */
/**
 * Redis Cleanup Utility
 * Helps manage Redis memory by cleaning up expired keys and monitoring usage
 */

import redisClient from "../Config/redis/redis.js"

export class RedisCleanup {
  /**
   * Clean up all expired keys manually
   */
  static async cleanupExpiredKeys(): Promise<void> {
    try {
      // Get all keys
      const keys = await redisClient.keys("*")
      console.log(`Found ${keys.length} keys in Redis`)

      let expiredCount = 0
      for (const key of keys) {
        const ttl = await redisClient.ttl(key)
        // TTL -1 means no expiration, TTL -2 means key doesn't exist
        if (ttl === -1) {
          console.log(`Warning: Key "${key}" has no TTL set`)
          // Optionally set TTL for keys without expiration
          await redisClient.expire(key, 3600) // 1 hour
          expiredCount++
        }
      }

      console.log(`Fixed ${expiredCount} keys without TTL`)
    } catch (error) {
      console.error("Error during Redis cleanup:", error)
    }
  }

  /**
   * Get Redis memory usage statistics
   */
  static async getMemoryStats(): Promise<void> {
    try {
      const info = await redisClient.info("memory")
      console.log("Redis Memory Stats:")
      console.log(info)

      const keyCount = await redisClient.dbSize()
      console.log(`Total keys in database: ${keyCount}`)
    } catch (error) {
      console.error("Error getting Redis stats:", error)
    }
  }

  /**
   * Clear all cache keys (use with caution)
   */
  static async clearAllCache(): Promise<void> {
    try {
      const cacheKeys = await redisClient.keys("accounts:*")
      const transactionKeys = await redisClient.keys("transactions:*")
      const investmentKeys = await redisClient.keys("investments:*")

      const allCacheKeys = [...cacheKeys, ...transactionKeys, ...investmentKeys]

      if (allCacheKeys.length > 0) {
        await redisClient.del(allCacheKeys)
        console.log(`Cleared ${allCacheKeys.length} cache keys`)
      } else {
        console.log("No cache keys found to clear")
      }
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  /**
   * Set TTL for all keys without expiration
   */
  static async fixKeysWithoutTTL(): Promise<void> {
    try {
      const keys = await redisClient.keys("*")
      let fixedCount = 0

      for (const key of keys) {
        const ttl = await redisClient.ttl(key)
        if (ttl === -1) {
          // Key exists but has no TTL
          await redisClient.expire(key, 3600) // Set 1 hour TTL
          fixedCount++
          console.log(`Fixed TTL for key: ${key}`)
        }
      }

      console.log(`Fixed ${fixedCount} keys without TTL`)
    } catch (error) {
      console.error("Error fixing keys without TTL:", error)
    }
  }
}

// Export individual functions for convenience
export const {
  cleanupExpiredKeys,
  getMemoryStats,
  clearAllCache,
  fixKeysWithoutTTL,
} = RedisCleanup