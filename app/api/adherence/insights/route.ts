import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { generateAdherenceInsight } from '@/lib/adherence';
import { predictAllRefills } from '@/lib/refillPrediction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;

    const adminSupabase = createServiceRoleClient();

    // Check privacy permissions if caller is different from target
    if (targetUserId !== user.id) {
      const { data: circle } = await adminSupabase
        .from('care_circles')
        .select(`
          id,
          members:circle_members(user_id, status, permissions)
        `)
        .eq('elder_id', targetUserId)
        .maybeSingle();

      const member = circle?.members?.find((m: any) => m.user_id === user.id);
      if (!member || member.status !== 'approved') {
        return NextResponse.json({ error: 'Unauthorized to view this elder’s adherence data' }, { status: 403 });
      }

      if (member.permissions?.medications === false) {
        return NextResponse.json(
          { error: 'The elder has restricted access to medication and adherence records' },
          { status: 403 }
        );
      }
    }

    // Fetch active medications
    const { data: medications } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true);

    // Fetch medication logs for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await adminSupabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('logged_at', thirtyDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    const insight = generateAdherenceInsight(medications || [], logs || []);
    const refillPredictions = predictAllRefills(medications || []);

    return NextResponse.json({
      insight,
      refillPredictions,
    });
  } catch (error) {
    console.error('Error in GET /api/adherence/insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
