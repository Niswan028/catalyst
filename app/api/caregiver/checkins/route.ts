// API route for caregiver to view linked user check-ins
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { checkElderPrivacyPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const elderlyUserId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!elderlyUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    // Verify elder privacy permissions
    const perm = await checkElderPrivacyPermission(
      adminSupabase,
      user.id,
      elderlyUserId,
      'health_checkins'
    );

    if (!perm.allowed) {
      return NextResponse.json(
        { error: perm.reason || 'You are not authorized to view this user’s check-ins' },
        { status: 403 }
      );
    }

    // Fetch check-ins
    const { data: checkins, error } = await adminSupabase
      .from('health_checkins')
      .select('*')
      .eq('user_id', elderlyUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ checkins: checkins || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
