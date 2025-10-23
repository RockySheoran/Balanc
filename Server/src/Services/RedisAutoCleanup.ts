/** @format */
/**
 * Automatic Redis Cleanup Service
 * Runs in background to maintain Redis memory and ensure all keys have proper TTL
 */

import redisClient from "../Config/redis/redis.js"

export class RedisAutoCleanup {
  private static cleanupInterval: NodeJS.Timeout | null = null
  private static isRunning = false

  /**
   * Start automatic cleanup service
   */
  static start(): void {
    if (this.isRunning) {
      console.log("🔄 Redis auto-cleanup already running")
      return
    }

    console.log("🚀 Starting Redis auto-cleanup service...")
    
    // Run initial cleanup
    this.performCleanup()

    // Schedule cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, 300 * 60 * 1000) //5 hours

    this.isRunning = true
    console.log("✅ Redis auto-cleanup service started (runs every 30 minutes)")
  }

  /**
   * Stop automatic cleanup service
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.isRunning = false
    console.log("🛑 Redis auto-cleanup service stopped")
  }

  /**
   * Perform cleanup operations
   */
  private static async performCleanup(): Promise<void> {
    try {
      const startTime = Date.now()
      
      // Fix keys without TTL
      const fixedCount = await this.fixKeysWithoutTTL()
      
      // Clean expired keys (Redis does this automatically, but we can force it)
      await this.forceExpiredKeyCleanup()
      
      // Monitor memory usage
      await this.monitorMemoryUsage()
      
      const duration = Date.now() - startTime
      
      if (fixedCount > 0) {
        console.log(`🧹 Auto-cleanup completed: Fixed ${fixedCount} keys (${duration}ms)`)
      }
    } catch (error) {
      console.error("❌ Auto-cleanup error:", error)
    }
  }

  /**
   * Fix keys without TTL
   */
  private static async fixKeysWithoutTTL(): Promise<number> {
    try {
      const keys = await redisClient.keys("*")
      let fixedCount = 0

      // Process keys in batches to avoid blocking
      const batchSize = 100
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)
        
        for (const key of batch) {
          const ttl = await redisClient.ttl(key)
          if (ttl === -1) {
            // Key exists but has no TTL
            await redisClient.expire(key, 3600) // 1 hour
            fixedCount++
          }
        }
      }

      return fixedCount
    } catch (error) {
      console.error("Error fixing keys without TTL:", error)
      return 0
    }
  }

  /**
   * Force cleanup of expired keys
   */
  private static async forceExpiredKeyCleanup(): Promise<void> {
    try {
      // Get keys that are about to expire (TTL < 60 seconds)
      const keys = await redisClient.keys("*")
      let expiredCount = 0

      for (const key of keys) {
        const ttl = await redisClient.ttl(key)
        if (ttl > 0 && ttl < 60) {
          // Key expires in less than 1 minute, let it expire naturally
          expiredCount++
        }
      }

      if (expiredCount > 10) {
        console.log(`⏰ ${expiredCount} keys expiring soon`)
      }
    } catch (error) {
      console.error("Error during expired key cleanup:", error)
    }
  }

  /**
   * Monitor Redis memory usage
   */
  private static async monitorMemoryUsage(): Promise<void> {
    try {
      const keyCount = await redisClient.dbSize()
      
      // Alert if too many keys
      if (keyCount > 1000) {
        console.log(`⚠️ High key count: ${keyCount} keys in Redis`)
      }

      // Get memory info every hour (only log if significant)
      const now = new Date()
      if (now.getMinutes() === 0) {
        const info = await redisClient.info("memory")
        const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
        if (memoryMatch) {
          console.log(`📊 Redis memory usage: ${memoryMatch[1].trim()}, Keys: ${keyCount}`)
        }
      }
    } catch (error) {
      console.error("Error monitoring memory usage:", error)
    }
  }

  /**
   * Get current status
   */
  static getStatus(): { isRunning: boolean; nextCleanup?: string } {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.isRunning ? "Every 30 minutes" : undefined
    }
  }
}

// Auto-start the service when module is imported
RedisAutoCleanup.start()

export default RedisAutoCleanup