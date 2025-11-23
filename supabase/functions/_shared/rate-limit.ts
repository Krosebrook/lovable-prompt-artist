/**
 * In-memory rate limiting for Supabase Edge Functions
 * For production, consider using Redis or database-backed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (note: this resets on function cold starts)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;         // Time window in milliseconds
  identifier: string;       // Unique identifier (user ID, IP, etc.)
  endpoint: string;         // Endpoint being rate limited
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const key = `${config.identifier}:${config.endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    cleanupExpiredEntries();
  }

  // If no entry or window expired, create new entry
  if (!entry || now >= entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMITS = {
  generateScript: {
    maxRequests: 10,        // 10 requests
    windowMs: 60 * 1000,    // per minute
  },
  generateStoryboard: {
    maxRequests: 30,        // 30 requests
    windowMs: 60 * 1000,    // per minute
  },
  generateShareLink: {
    maxRequests: 20,        // 20 requests
    windowMs: 60 * 1000,    // per minute
  },
  exportVideo: {
    maxRequests: 5,         // 5 requests
    windowMs: 60 * 1000,    // per minute
  },
};
