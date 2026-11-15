import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, AuthenticatedContext } from '../supabase/authServer';
import { errorResponse } from './response';

export type CircleRole = 'owner' | 'elder' | 'editor' | 'viewer';

/**
 * Higher-order function requiring circle membership with specific role(s)
 */
export function withCircleRole(
  allowedRoles: CircleRole[],
  handler: (
    request: NextRequest,
    context: AuthenticatedContext & { circleRole: CircleRole; circleId: string },
    routeParams?: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeParams?: any): Promise<NextResponse> => {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return errorResponse('UNAUTHORIZED', authResult.error, authResult.status);
    }

    const { supabase, user } = authResult;

    // Extract circleId from routeParams, query params, or header
    const { searchParams } = new URL(request.url);
    const circleId =
      routeParams?.params?.id ||
      routeParams?.params?.circle_id ||
      searchParams.get('circle_id') ||
      request.headers.get('x-circle-id');

    if (!circleId) {
      return errorResponse('BAD_REQUEST', 'Missing circle_id parameter', 400);
    }

    // Verify membership in circle_members
    const { data: member, error: memberErr } = await supabase
      .from('circle_members')
      .select('role, status')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberErr || !member || (member.status !== 'approved' && member.status !== 'active')) {
      return errorResponse('FORBIDDEN', 'Access denied: not an approved member of this care circle', 403);
    }

    if (!allowedRoles.includes(member.role as CircleRole)) {
      return errorResponse(
        'FORBIDDEN',
        `Access denied: required role in [${allowedRoles.join(', ')}], current role is '${member.role}'`,
        403
      );
    }

    return handler(
      request,
      { ...authResult, circleRole: member.role as CircleRole, circleId },
      routeParams
    );
  };
}
