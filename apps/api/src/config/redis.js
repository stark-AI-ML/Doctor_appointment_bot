import Redis from 'ioredis'
import env from './env.js'
import logger from '../utils/logger.js'

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null // stop retrying
    return Math.min(times * 200, 2000)
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error:', err.message))

/**
 * Simple cache helper.
 * - get/set with TTL (seconds)
 * - del to invalidate
 * - wrap: fetch-through cache (check cache → miss → call fn → store)
 */
export const cache = {
  async get(key) {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  },

  async set(key, data, ttlSeconds = 120) {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
  },

  async del(key) {
    await redis.del(key)
  },

  /** Delete all keys matching a pattern, e.g. 'doctors:*' */
  async invalidate(pattern) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  },

  /**
   * Fetch-through cache.
   * Returns cached value if exists, otherwise calls fn(), caches result, returns it.
   */
  async wrap(key, fn, ttlSeconds = 120) {
    const cached = await this.get(key)
    if (cached) return cached
    const fresh = await fn()
    await this.set(key, fresh, ttlSeconds)
    return fresh
  },
}

export default redis
