/** @format */
/**
 * Redis Cleanup Script
 * Run this script to clean up Redis and ensure all keys have proper TTL
 */

import { RedisCleanup } from "../Utils/redisCleanup.js"

async function main() {
  console.log("🧹 Starting Redis cleanup...")

  try {
    // Get current memory stats
    console.log("\n📊 Current Redis Stats:")
    await RedisCleanup.getMemoryStats()

    // Fix keys without TTL
    console.log("\n🔧 Fixing keys without TTL...")
    await RedisCleanup.fixKeysWithoutTTL()

    // Clean up expired keys
    console.log("\n🗑️ Cleaning up expired keys...")
    await RedisCleanup.cleanupExpiredKeys()

    // Get final stats
    console.log("\n📊 Final Redis Stats:")
    await RedisCleanup.getMemoryStats()

    console.log("\n✅ Redis cleanup completed!")
  } catch (error) {
    console.error("❌ Error during cleanup:", error)
  }

  process.exit(0)
}

main()