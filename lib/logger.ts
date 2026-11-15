/**
 * Structured, PII-free logger for CareConnect
 * Sanitizes emails, passwords, passcodes, and tokens from logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') {
    // Mask email addresses
    if (val.includes('@')) {
      return val.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    }
    // Mask passcodes / passwords / tokens
    if (/^[A-Za-z0-9_-]{20,}$/.test(val)) {
      return `${val.substring(0, 4)}...[REDACTED]`;
    }
    return val;
  }
  if (typeof val === 'object' && val !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (/password|passcode|token|secret|key/i.test(k)) {
        sanitized[k] = '[REDACTED]';
      } else {
        sanitized[k] = sanitizeValue(v);
      }
    }
    return sanitized;
  }
  return val;
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        context: context ? sanitizeValue(context) : undefined,
      })
    );
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        context: context ? sanitizeValue(context) : undefined,
      })
    );
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? error.message : String(error),
        context: context ? sanitizeValue(context) : undefined,
      })
    );
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        JSON.stringify({
          level: 'debug',
          timestamp: new Date().toISOString(),
          message,
          context: context ? sanitizeValue(context) : undefined,
        })
      );
    }
  },
};
