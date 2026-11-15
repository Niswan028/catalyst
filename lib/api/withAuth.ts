import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, AuthenticatedContext } from '../supabase/authServer';
import { errorResponse } from './response';
import { logger } from '../logger';
import { getErrorMessage } from '../errors';

export type RouteParamsContext = { params?: Record<string, string | string[]> };

export type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: AuthenticatedContext,
  routeParams?: RouteParamsContext
) => Promise<NextResponse>;

/**
 * Middleware wrapper for API routes requiring authenticated session.
 * Enforces server-side authentication and standardizes error responses.
 */
export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (request: NextRequest, routeParams?: RouteParamsContext): Promise<NextResponse> => {
    const authResult = await getAuthenticatedContext(request);

    if ('error' in authResult) {
      return errorResponse('UNAUTHORIZED', authResult.error, authResult.status);
    }

    try {
      return await handler(request, authResult, routeParams);
    } catch (err: unknown) {
      logger.error('Unhandled API Error in withAuth', { error: err });
      const message = getErrorMessage(err, 'Internal Server Error');
      return errorResponse('INTERNAL_SERVER_ERROR', message, 500);
    }
  };
}
