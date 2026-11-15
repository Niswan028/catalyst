import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, AuthenticatedContext } from '../supabase/authServer';
import { errorResponse } from './response';

export type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: AuthenticatedContext,
  routeParams?: any
) => Promise<NextResponse>;

/**
 * Middleware wrapper for API routes requiring authenticated session
 */
export function withAuth(handler: AuthenticatedRouteHandler) {
  return async (request: NextRequest, routeParams?: any): Promise<NextResponse> => {
    const authResult = await getAuthenticatedContext(request);

    if ('error' in authResult) {
      return errorResponse('UNAUTHORIZED', authResult.error, authResult.status);
    }

    try {
      return await handler(request, authResult, routeParams);
    } catch (err) {
      console.error('Unhandled API Error in withAuth:', err);
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return errorResponse('INTERNAL_SERVER_ERROR', message, 500);
    }
  };
}
