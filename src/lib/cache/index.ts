/**
 * Production caching abstraction.
 * Currently uses an in-memory map which is safe for short TTLs and single instances.
 * In a fully distributed setting, this would point to Redis.
 */

const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  },

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async delete(key: string): Promise<void> {
    memoryCache.delete(key);
  }
};
