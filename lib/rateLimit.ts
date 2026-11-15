// In-memory and extensible rate limiter for auth, passcode, and sensitive actions

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  maxAttempts: number; // e.g. 5
  windowMs: number;    // e.g. 15 minutes (15 * 60 * 1000)
  lockoutMs: number;   // e.g. 15 minutes (15 * 60 * 1000)
}

export const PASSCODE_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,   // 15 minutes
  lockoutMs: 15 * 60 * 1000,  // 15 minutes lockout
};

export const AUTH_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
};

export const EMAIL_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 30,
  windowMs: 60 * 1000, // 30 requests per minute
  lockoutMs: 60 * 1000,
};

/**
 * Check if an identifier is rate-limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = PASSCODE_RATE_LIMIT_CONFIG
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // Check if locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // If window expired, reset
  if (now - record.firstAttemptAt > config.windowMs) {
    memoryStore.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  const remaining = Math.max(0, config.maxAttempts - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(
  identifier: string,
  config: RateLimitConfig = PASSCODE_RATE_LIMIT_CONFIG
): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (!record || now - record.firstAttemptAt > config.windowMs) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= config.maxAttempts) {
    record.lockedUntil = now + config.lockoutMs;
    memoryStore.set(identifier, record);
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(config.lockoutMs / 1000),
    };
  }

  memoryStore.set(identifier, record);
  return {
    locked: false,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit on success
 */
export function resetRateLimit(identifier: string): void {
  memoryStore.delete(identifier);
}

/**
 * Clear all memory store (useful for unit tests)
 */
export function clearRateLimitStore(): void {
  memoryStore.clear();
}
