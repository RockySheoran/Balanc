import axios, { AxiosError } from "axios"

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache
const MAX_CACHE_SIZE = 100
const MAX_RETRIES = 3
const BASE_RETRY_DELAY = 1000 // 1 second
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const CONCURRENCY_LIMIT = 3
const REQUEST_TIMEOUT = 10000 // 10 seconds

type ApiKeyStatus = {
  failures: number
  lastUsed: number
  lastSuccess: number
  isActive: boolean
  quota?: number
}

type CacheEntry = {
  data: any
  timestamp: number
  etag?: string
}

export class ApiManager {
  private apiKeys: string[]
  private keyStatus: Record<string, ApiKeyStatus>
  private cache: Map<string, CacheEntry>
  private cacheQueue: string[]
  private pendingRequests: Map<string, Promise<any>>
  private isHealthCheckRunning = false

  constructor(apiKeys: string[]) {
    this.apiKeys = apiKeys.filter(Boolean)
    this.cache = new Map()
    this.cacheQueue = []
    this.pendingRequests = new Map()
    
    // Initialize key status
    this.keyStatus = this.apiKeys.reduce((acc, key) => ({
      ...acc,
      [key]: {
        failures: 0,
        lastUsed: 0,
        lastSuccess: 0,
        isActive: true,
        quota: 100 // Default quota
      }
    }), {})

    // Start periodic health checks
    this.startHealthChecks()
  }

  private startHealthChecks() {
    setInterval(() => this.runHealthChecks(), HEALTH_CHECK_INTERVAL)
  }

  private async runHealthChecks() {
    if (this.isHealthCheckRunning) return
    this.isHealthCheckRunning = true

    try {
      const testSymbol = 'AAPL' // Reliable test symbol
      await Promise.all(this.apiKeys.map(async (key) => {
        if (!this.keyStatus[key].isActive) return

        try {
          const response = await axios.get(
            'https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart',
            {
              params: { symbol: testSymbol, range: '1d', interval: '1d' },
              headers: this.getHeaders(key),
              timeout: 5000
            }
          )

          this.keyStatus[key] = {
            ...this.keyStatus[key],
            failures: 0,
            lastSuccess: Date.now(),
            isActive: true,
            quota: response.headers['x-ratelimit-remaining'] 
                   ? parseInt(response.headers['x-ratelimit-remaining']) 
                   : this.keyStatus[key].quota
          }
        } catch (error) {
          this.handleKeyError(key, error)
        }
      }))
    } finally {
      this.isHealthCheckRunning = false
    }
  }

  private getHeaders(key: string) {
    return {
      'x-rapidapi-key': key,
      'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  }

  private handleKeyError(key: string, error: unknown) {
    const status = this.keyStatus[key]
    const newFailures = status.failures + 1

    this.keyStatus[key] = {
      ...status,
      failures: newFailures,
      isActive: newFailures < MAX_RETRIES,
      lastUsed: Date.now()
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429 || error.response?.status === 403) {
        // If rate limited, deactivate for longer
        this.keyStatus[key].isActive = false
      }
    }
  }

  private getOptimalKey(): string | null {
    const now = Date.now()
    const activeKeys = this.apiKeys.filter(key => this.keyStatus[key].isActive)

    if (activeKeys.length === 0) return null

    // Sort by: highest quota -> fewest failures -> least recently used
    return activeKeys.sort((a, b) => {
      const aStatus = this.keyStatus[a]
      const bStatus = this.keyStatus[b]

      // Prioritize keys with higher quota
      if (aStatus.quota !== bStatus.quota) {
        return (bStatus.quota || 0) - (aStatus.quota || 0)
      }

      // Then by failure count
      if (aStatus.failures !== bStatus.failures) {
        return aStatus.failures - bStatus.failures
      }

      // Finally by last used time
      return aStatus.lastUsed - bStatus.lastUsed
    })[0]
  }

  private async makeRequest(params: any, key: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://yahoo-finance166.p.rapidapi.com/api/stock/get-chart',
        {
          params,
          headers: this.getHeaders(key),
          timeout: REQUEST_TIMEOUT
        }
      )

      if (!response.data?.chart?.result?.[0]) {
        throw new Error('Invalid response structure')
      }

      // Update key status on success
      this.keyStatus[key] = {
        ...this.keyStatus[key],
        failures: 0,
        lastSuccess: Date.now(),
        lastUsed: Date.now(),
        isActive: true,
        quota: response.headers['x-ratelimit-remaining'] 
               ? parseInt(response.headers['x-ratelimit-remaining']) 
               : this.keyStatus[key].quota
      }

      return {
        data: response.data,
        etag: response.headers['etag']
      }
    } catch (error) {
      this.handleKeyError(key, error)
      throw error
    }
  }

  private addToCache(key: string, data: any, etag?: string) {
    // Clean expired cache entries first
    this.cleanCache()

    // Add new entry
    this.cache.set(key, { data, timestamp: Date.now(), etag })
    this.cacheQueue.push(key)

    // Enforce max cache size
    while (this.cacheQueue.length > MAX_CACHE_SIZE) {
      const oldestKey = this.cacheQueue.shift()
      if (oldestKey) this.cache.delete(oldestKey)
    }
  }

  private cleanCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key)
        this.cacheQueue = this.cacheQueue.filter(k => k !== key)
      }
    }
  }

  async getChartData(symbol: string, range: string, interval: string): Promise<any> {
    const cacheKey = `${symbol}-${range}-${interval}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    
    // Check for pending request
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      return pendingRequest
    }

    const request = this.executeWithRetry(symbol, range, interval)
    this.pendingRequests.set(cacheKey, request)

    try {
      const result = await request
      this.addToCache(cacheKey, result.data, result.etag)
      return result.data
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async executeWithRetry(
    symbol: string,
    range: string,
    interval: string,
    attempt = 0
  ): Promise<{ data: any; etag?: string }> {
    const key = this.getOptimalKey()
    if (!key) throw new Error('No available API keys')

    try {
      const response = await this.makeRequest({ symbol, range, interval }, key)
      return response
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeWithRetry(symbol, range, interval, attempt + 1)
      }
      throw error
    }
  }
}

// Singleton instance
let apiManagerInstance: ApiManager | null = null

export const getApiManager = (apiKeys: string[]): ApiManager => {
  if (!apiManagerInstance) {
    apiManagerInstance = new ApiManager(apiKeys)
  }
  return apiManagerInstance
}