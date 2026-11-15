// API route for caregiver to view linked user medications
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

    if (!elderlyUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    // Verify elder privacy permissions
    const perm = await checkElderPrivacyPermission(
      adminSupabase,
      user.id,
      elderlyUserId,
      'medications'
    );

    if (!perm.allowed) {
      return NextResponse.json(
        { error: perm.reason || 'You are not authorized to view this user’s medications' },
        { status: 403 }
      );
    }

    // Fetch medications
    const { data: medications, error } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('user_id', elderlyUserId)
      .eq('is_active', true)
      .order('time');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ medications: medications || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
