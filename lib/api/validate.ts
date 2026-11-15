import { NextRequest } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from './response';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: ReturnType<typeof errorResponse> };

/**
 * Validate request JSON body against a Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid input payload';
      return {
        success: false,
        response: errorResponse('VALIDATION_ERROR', message, 400, parsed.error.issues),
      };
    }

    return { success: true, data: parsed.data };
  } catch (err) {
    return {
      success: false,
      response: errorResponse('BAD_REQUEST', 'Malformed JSON payload', 400),
    };
  }
}

/**
 * Validate URL query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    const parsed = schema.safeParse(queryObj);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid query parameters';
      return {
        success: false,
        response: errorResponse('VALIDATION_ERROR', message, 400, parsed.error.issues),
      };
    }

    return { success: true, data: parsed.data };
  } catch (err) {
    return {
      success: false,
      response: errorResponse('BAD_REQUEST', 'Invalid query parameters', 400),
    };
  }
}
