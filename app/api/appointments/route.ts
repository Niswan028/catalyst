import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { createAppointmentSchema } from '@/lib/validations/appointments';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { supabase, user } = authResult;
    const { searchParams } = new URL(request.url);

    const circleIdParam = searchParams.get('circle_id');
    const statusParam = searchParams.get('status') || 'upcoming';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const adminSupabase = createServiceRoleClient();

    // Determine target circle IDs
    let circleIds: string[] = [];

    if (circleIdParam) {
      // Check user belongs to this circle
      const { data: circle } = await adminSupabase
        .from('care_circles')
        .select('elder_id')
        .eq('id', circleIdParam)
        .single();

      if (circle) {
        if (circle.elder_id === user.id) {
          circleIds = [circleIdParam];
        } else {
          const { data: member } = await adminSupabase
            .from('circle_members')
            .select('status, permissions')
            .eq('circle_id', circleIdParam)
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .single();

          if (member) {
            circleIds = [circleIdParam];
          }
        }
      }
    } else {
      // Find all circles user belongs to
      const { data: elderCircles } = await adminSupabase
        .from('care_circles')
        .select('id')
        .eq('elder_id', user.id);

      const { data: memberCircles } = await adminSupabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const set = new Set<string>();
      elderCircles?.forEach((c) => set.add(c.id));
      memberCircles?.forEach((c) => set.add(c.circle_id));
      circleIds = Array.from(set);
    }

    if (circleIds.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    let query = adminSupabase
      .from('appointments')
      .select(`
        id,
        circle_id,
        doctor_name,
        specialty,
        location,
        datetime,
        notes,
        status,
        created_by,
        created_at,
        updated_at,
        circle:care_circles(name, elder_id)
      `)
      .in('circle_id', circleIds);

    if (statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    query = query.order('datetime', { ascending: statusParam === 'upcoming' }).limit(limit);

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Error in GET /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { supabase, user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const body = await request.json();
    const validated = createAppointmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid appointment data' },
        { status: 400 }
      );
    }

    let targetCircleId = validated.data.circle_id;

    if (!targetCircleId) {
      // Find or default to user's circle
      const { data: circle } = await adminSupabase
        .from('care_circles')
        .select('id')
        .eq('elder_id', user.id)
        .maybeSingle();

      if (circle) {
        targetCircleId = circle.id;
      } else {
        // Check if member with editor role
        const { data: membership } = await adminSupabase
          .from('circle_members')
          .select('circle_id, role, status')
          .eq('user_id', user.id)
          .eq('role', 'editor')
          .eq('status', 'approved')
          .maybeSingle();

        if (membership) {
          targetCircleId = membership.circle_id;
        }
      }
    }

    if (!targetCircleId) {
      return NextResponse.json(
        { error: 'Care circle could not be determined. Please specify circle_id.' },
        { status: 400 }
      );
    }

    // Check permissions: elder or approved editor
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', targetCircleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;
    if (!isElder) {
      const { data: member } = await adminSupabase
        .from('circle_members')
        .select('role, status, permissions')
        .eq('circle_id', targetCircleId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member || member.role !== 'editor') {
        return NextResponse.json(
          { error: 'Only elders or approved circle editors can schedule appointments' },
          { status: 403 }
        );
      }
    }

    const { data: newAppointment, error: insertError } = await adminSupabase
      .from('appointments')
      .insert({
        circle_id: targetCircleId,
        doctor_name: validated.data.doctor_name,
        specialty: validated.data.specialty || null,
        location: validated.data.location || null,
        datetime: validated.data.datetime,
        notes: validated.data.notes || null,
        status: validated.data.status,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      circleId: targetCircleId,
      actorId: user.id,
      action: 'appointment_created',
      resourceType: 'appointments',
      resourceId: newAppointment.id,
      details: {
        doctor: validated.data.doctor_name,
        datetime: validated.data.datetime,
      },
    });

    return NextResponse.json(
      {
        message: 'Doctor appointment scheduled successfully',
        appointment: newAppointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
