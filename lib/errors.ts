/**
 * Centralized, strongly-typed Error classes and API error response formatters.
 * Ensures consistent error shapes across all Next.js API routes and UI components.
 */

import { NextResponse } from 'next/server';

/**
 * Standard API error payload returned to clients.
 */
export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Base Application Error class with HTTP status code and error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 401 Unauthorized Error
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', details?: unknown) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

/**
 * 400 Bad Request / Validation Error
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests Error
 */
export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number;

  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds = 60) {
    super(message, 429, 'RATE_LIMITED', { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Extracts a safe, human-readable error message from an unknown thrown entity.
 *
 * @param error - The caught unknown error object or string
 * @param defaultMessage - Fallback message if string conversion fails
 * @returns Safe string message
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return defaultMessage;
}

/**
 * Creates a uniform JSON NextResponse for API error handling.
 *
 * @param error - The caught error
 * @param fallbackStatus - Default HTTP status code if error is not an AppError (default: 500)
 * @returns Standardized NextResponse
 */
export function createErrorResponse(error: unknown, fallbackStatus = 500): NextResponse<ApiErrorShape> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  const message = getErrorMessage(error);
  return NextResponse.json(
    {
      error: {
        code: fallbackStatus === 400 ? 'BAD_REQUEST' : fallbackStatus === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message,
      },
    },
    { status: fallbackStatus }
  );
}
