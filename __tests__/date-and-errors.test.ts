// Tests for date helpers, error classes, constants, and auth cookie management
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatTime24to12, formatDateTime } from '@/lib/date';
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  getErrorMessage,
  createErrorResponse,
} from '@/lib/errors';
import {
  AUTH_CONSTANTS,
  USER_ROLES,
  CIRCLE_ROLES,
  CIRCLE_STATUS,
  DOSE_STATUS,
  APPOINTMENT_STATUS,
  SECURITY_CONFIG,
} from '@/lib/constants';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth/cookies';

describe('Date & Time Utilities (lib/date.ts)', () => {
  it('formats dates safely into readable strings', () => {
    const formatted = formatDate('2026-11-15T10:30:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate('invalid-date')).toBe('Invalid date');
  });

  it('converts 24-hour time to 12-hour AM/PM format accurately', () => {
    expect(formatTime24to12('08:00')).toBe('8:00 AM');
    expect(formatTime24to12('12:00')).toBe('12:00 PM');
    expect(formatTime24to12('13:30')).toBe('1:30 PM');
    expect(formatTime24to12('00:00')).toBe('12:00 AM');
    expect(formatTime24to12('00:45')).toBe('12:45 AM');
    expect(formatTime24to12(null)).toBe('');
    expect(formatTime24to12('invalid')).toBe('invalid');
  });

  it('formats full date-times with fallback for errors', () => {
    const formatted = formatDateTime('2026-11-15T14:30:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatDateTime(null)).toBe('N/A');
    expect(formatDateTime('invalid')).toBe('Invalid date');
  });
});

describe('Typed Error Hierarchy (lib/errors.ts)', () => {
  it('creates AppError with correct defaults', () => {
    const err = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('instantiates specialized subclasses with matching HTTP status codes', () => {
    const authErr = new AuthError('Authentication required');
    expect(authErr.statusCode).toBe(401);
    expect(authErr.code).toBe('UNAUTHORIZED');

    const forbErr = new ForbiddenError('Permission denied');
    expect(forbErr.statusCode).toBe(403);
    expect(forbErr.code).toBe('FORBIDDEN');

    const notFoundErr = new NotFoundError('Prescription');
    expect(notFoundErr.statusCode).toBe(404);
    expect(notFoundErr.code).toBe('NOT_FOUND');
    expect(notFoundErr.message).toBe('Prescription not found');

    const valErr = new ValidationError('Invalid dosage format');
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe('VALIDATION_ERROR');

    const rateErr = new RateLimitError('Too many attempts', 90);
    expect(rateErr.statusCode).toBe(429);
    expect(rateErr.code).toBe('RATE_LIMITED');
    expect(rateErr.retryAfterSeconds).toBe(90);
  });

  it('extracts messages safely with getErrorMessage', () => {
    expect(getErrorMessage(new Error('Test message'))).toBe('Test message');
    expect(getErrorMessage('Raw string error')).toBe('Raw string error');
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('creates unified API error responses with createErrorResponse', async () => {
    const resp = createErrorResponse(new ForbiddenError('You cannot edit this circle'));
    expect(resp.status).toBe(403);
    const data = await resp.json();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(data.error.message).toBe('You cannot edit this circle');
  });
});

describe('Constants & Security Configuration (lib/constants.ts)', () => {
  it('contains expected role and status configurations', () => {
    expect(USER_ROLES.ELDER).toBe('elderly_user');
    expect(USER_ROLES.CAREGIVER).toBe('caregiver');
    expect(CIRCLE_ROLES.OWNER).toBe('owner');
    expect(CIRCLE_ROLES.EDITOR).toBe('editor');
    expect(CIRCLE_ROLES.VIEWER).toBe('viewer');
    expect(CIRCLE_STATUS.APPROVED).toBe('approved');
    expect(DOSE_STATUS.TAKEN).toBe('taken');
    expect(APPOINTMENT_STATUS.UPCOMING).toBe('upcoming');
  });

  it('enforces hardened security settings', () => {
    expect(SECURITY_CONFIG.PASSCODE_MAX_ATTEMPTS).toBe(5);
    expect(SECURITY_CONFIG.PASSCODE_LOCKOUT_MINUTES).toBe(15);
    expect(AUTH_CONSTANTS.COOKIE_NAME).toBe('sb-access-token');
    expect(AUTH_CONSTANTS.COOKIE_MAX_AGE_SECONDS).toBe(604800);
  });
});

describe('Cookie Helpers (lib/auth/cookies.ts)', () => {
  const originalDocument = global.document;

  beforeEach(() => {
    let cookieStore = '';
    // Mock document.cookie in Node environment
    (global as any).document = {
      get cookie() {
        return cookieStore;
      },
      set cookie(val: string) {
        cookieStore = val;
      },
    };
  });

  afterEach(() => {
    (global as any).document = originalDocument;
  });

  it('sets and clears authentication cookie in document.cookie', () => {
    setAuthCookie('jwt-token-abc');
    expect(document.cookie).toContain('sb-access-token=jwt-token-abc');

    clearAuthCookie();
    expect(document.cookie).toContain('max-age=0');
  });
});
