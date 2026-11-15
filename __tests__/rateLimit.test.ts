import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  clearRateLimitStore,
  PASSCODE_RATE_LIMIT_CONFIG,
} from '../lib/rateLimit';

describe('Rate Limiter for Passcode Security', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('initially allows requests with 5 remaining attempts', () => {
    const status = checkRateLimit('test-ip-1', PASSCODE_RATE_LIMIT_CONFIG);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });

  it('decrements remaining attempts on failed attempt', () => {
    recordFailedAttempt('test-ip-1', PASSCODE_RATE_LIMIT_CONFIG);
    const status = checkRateLimit('test-ip-1', PASSCODE_RATE_LIMIT_CONFIG);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(4);
  });

  it('locks out after 5 consecutive failed attempts for 15 minutes', () => {
    for (let i = 0; i < 4; i++) {
      const result = recordFailedAttempt('test-ip-lockout', PASSCODE_RATE_LIMIT_CONFIG);
      expect(result.locked).toBe(false);
    }

    // 5th failed attempt should trigger lockout
    const fifthResult = recordFailedAttempt('test-ip-lockout', PASSCODE_RATE_LIMIT_CONFIG);
    expect(fifthResult.locked).toBe(true);
    expect(fifthResult.retryAfterSeconds).toBeGreaterThan(0);

    const check = checkRateLimit('test-ip-lockout', PASSCODE_RATE_LIMIT_CONFIG);
    expect(check.allowed).toBe(false);
    expect(check.remainingAttempts).toBe(0);
    expect(check.retryAfterSeconds).toBeGreaterThan(800);
  });

  it('resets attempts after successful verification', () => {
    recordFailedAttempt('test-ip-reset', PASSCODE_RATE_LIMIT_CONFIG);
    recordFailedAttempt('test-ip-reset', PASSCODE_RATE_LIMIT_CONFIG);

    resetRateLimit('test-ip-reset');

    const status = checkRateLimit('test-ip-reset', PASSCODE_RATE_LIMIT_CONFIG);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });
});
