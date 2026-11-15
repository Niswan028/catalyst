import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const circleId = params.id;
    const adminSupabase = createServiceRoleClient();

    // Verify user is elder or approved member of this circle
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;
    if (!isElder) {
      const { data: member } = await adminSupabase
        .from('circle_members')
        .select('status')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data: logs, error } = await adminSupabase
      .from('audit_log')
      .select('*, actor:users!audit_log_actor_id_fkey(full_name, email, role)')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ audit_logs: logs || [] });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
