import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { updateAppointmentSchema } from '@/lib/validations/appointments';
import { logAuditEvent } from '@/lib/audit';

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
    const appointmentId = params.id;
    const adminSupabase = createServiceRoleClient();

    const { data: appointment, error } = await adminSupabase
      .from('appointments')
      .select('*, circle:care_circles(name, elder_id)')
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify user belongs to circle
    const isElder = appointment.circle?.elder_id === user.id;
    if (!isElder) {
      const { data: member } = await adminSupabase
        .from('circle_members')
        .select('status')
        .eq('circle_id', appointment.circle_id)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error in GET /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const appointmentId = params.id;
    const adminSupabase = createServiceRoleClient();

    const { data: appointment } = await adminSupabase
      .from('appointments')
      .select('*, circle:care_circles(elder_id)')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Permission check: elder or approved editor
    const isElder = appointment.circle?.elder_id === user.id;
    if (!isElder) {
      const { data: member } = await adminSupabase
        .from('circle_members')
        .select('role, status')
        .eq('circle_id', appointment.circle_id)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member || member.role !== 'editor') {
        return NextResponse.json(
          { error: 'Only elders or approved editors can update appointments' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validated = updateAppointmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      ...validated.data,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await adminSupabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      circleId: appointment.circle_id,
      actorId: user.id,
      action: 'appointment_updated',
      resourceType: 'appointments',
      resourceId: appointmentId,
      details: updates,
    });

    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: updated,
    });
  } catch (error) {
    console.error('Error in PATCH /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const appointmentId = params.id;
    const adminSupabase = createServiceRoleClient();

    const { data: appointment } = await adminSupabase
      .from('appointments')
      .select('*, circle:care_circles(elder_id)')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Permission check: elder or approved editor
    const isElder = appointment.circle?.elder_id === user.id;
    if (!isElder) {
      const { data: member } = await adminSupabase
        .from('circle_members')
        .select('role, status')
        .eq('circle_id', appointment.circle_id)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member || member.role !== 'editor') {
        return NextResponse.json(
          { error: 'Only elders or approved editors can cancel appointments' },
          { status: 403 }
        );
      }
    }

    // Instead of hard-deleting, update status to cancelled
    const { error: cancelError } = await adminSupabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (cancelError) {
      return NextResponse.json({ error: cancelError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      circleId: appointment.circle_id,
      actorId: user.id,
      action: 'appointment_cancelled',
      resourceType: 'appointments',
      resourceId: appointmentId,
      details: { doctor: appointment.doctor_name },
    });

    return NextResponse.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
