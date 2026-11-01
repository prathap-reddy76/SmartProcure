/**
 * Production rate limiting abstraction.
 * In a fully distributed setting, this would point to Redis using a sliding window or fixed window algorithm.
 */

const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  /**
   * Checks if a key has exceeded its limit. Returns true if allowed, false if blocked.
   * Increments the count automatically.
   */
  async check(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record) {
      memoryStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (now > record.resetTime) {
      memoryStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }
};
