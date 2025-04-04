/** @format */

import redisService from "./redis.service.js"



class CacheService {
  async cacheResponse<T>(
    key: string,
    data: T,
    ttl: number = 3600
  ): Promise<void> {
    if (!data) return
    await redisService.set<T>(key, data, ttl)
  }

  async getFromCache<T>(key: string): Promise<T | null> {
    return await redisService.get<T>(key)
  }

  async invalidateCache(key: string): Promise<number> {
    return await redisService.del(key)
  }
}

export default new CacheService()
