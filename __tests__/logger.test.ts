import { describe, it, expect, vi } from 'vitest';
import { logger } from '../lib/logger';

describe('Structured PII-Sanitizing Logger', () => {
  it('masks sensitive email addresses in logs', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('User logged in', { email: 'eleanor.vance.demo@gmail.com' });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(logCall);

    expect(parsed.context.email).toContain('***');
    expect(parsed.context.email).not.toBe('eleanor.vance.demo@gmail.com');
    consoleSpy.mockRestore();
  });

  it('masks passcodes and passwords', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Attempting passcode verification', {
      passcode: 'SECRET99',
      password: 'MyPassword123!',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(logCall);

    expect(parsed.context.passcode).toBe('[REDACTED]');
    expect(parsed.context.password).toBe('[REDACTED]');
    consoleSpy.mockRestore();
  });

  it('logs errors with stack trace details', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Database connection failed');
    logger.error('CRON_FAILURE', testError);

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe('error');
    expect(parsed.error).toBe('Database connection failed');
    consoleSpy.mockRestore();
  });
});
