import { config } from '../config';

let redisClient: any = null;
let redisAvailable = false;

/**
 * Initialize Redis connection (lazy, non-blocking).
 * If Redis is not configured or unavailable, the app continues without it.
 */
export async function initRedis(): Promise<void> {
  if (!config.redis?.url) {
    console.log('[Redis] No REDIS_URL configured — caching disabled');
    return;
  }

  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: config.redis.url });

    redisClient.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      redisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await redisClient.connect();
    redisAvailable = true;
  } catch (error: any) {
    console.warn('[Redis] Failed to connect:', error.message);
    redisClient = null;
    redisAvailable = false;
  }
}

/**
 * Get the Redis client instance. Returns null if not available.
 */
export function getRedisClient(): any {
  return redisAvailable ? redisClient : null;
}

/**
 * Cache helper — get from cache or compute and store.
 */
export async function cacheGet<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlSeconds = 300,
): Promise<T> {
  const client = getRedisClient();

  if (client) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Cache miss or error — compute fresh
    }
  }

  const result = await computeFn();

  if (client) {
    try {
      await client.setEx(key, ttlSeconds, JSON.stringify(result));
    } catch {
      // Ignore cache write failures
    }
  }

  return result;
}

/**
 * Invalidate cache key(s).
 */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.del(keys);
    } catch {
      // Ignore
    }
  }
}

/**
 * Gracefully disconnect Redis.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore
    }
    redisClient = null;
    redisAvailable = false;
  }
}
