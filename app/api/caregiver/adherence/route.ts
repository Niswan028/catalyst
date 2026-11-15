// API route for caregiver to view medication adherence reports
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { checkElderPrivacyPermission } from '@/lib/permissions';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const elderlyUserId = searchParams.get('user_id');
    const period = searchParams.get('period') || 'week'; // 'week' or 'month'

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
        { error: perm.reason || 'You are not authorized to view this user’s adherence data' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    // Fetch active medications
    const { data: medications, error: medsError } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('user_id', elderlyUserId)
      .eq('is_active', true);

    if (medsError) {
      return NextResponse.json({ error: medsError.message }, { status: 400 });
    }

    // Fetch medication logs in date range
    const { data: logs, error: logsError } = await adminSupabase
      .from('medication_logs')
      .select('*, medication:medications(*)')
      .eq('user_id', elderlyUserId)
      .gte('scheduled_time', startDate.toISOString())
      .lte('scheduled_time', endDate.toISOString())
      .order('scheduled_time', { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 400 });
    }

    // Calculate adherence statistics
    const totalLogs = logs?.length || 0;
    const takenLogs = logs?.filter((l) => l.status === 'taken').length || 0;
    const skippedLogs = logs?.filter((l) => l.status === 'skipped').length || 0;
    const laterLogs = logs?.filter((l) => l.status === 'later').length || 0;

    const overallRate = totalLogs > 0 ? (takenLogs / totalLogs) * 100 : 0;

    // Per-medication stats
    const byMedication = (medications || []).map((med) => {
      const medLogs = logs?.filter((l) => l.medication_id === med.id) || [];
      const medTaken = medLogs.filter((l) => l.status === 'taken').length;
      const medTotal = medLogs.length;
      const adherenceRate = medTotal > 0 ? (medTaken / medTotal) * 100 : 0;

      return {
        medication: med,
        totalLogs: medTotal,
        takenCount: medTaken,
        adherenceRate,
      };
    });

    return NextResponse.json({
      period,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      overall: {
        totalLogs,
        takenCount: takenLogs,
        skippedCount: skippedLogs,
        laterCount: laterLogs,
        adherenceRate: overallRate,
      },
      byMedication,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
