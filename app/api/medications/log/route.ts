// API route for medication logs with Zod validation
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { logMedicationSchema } from '@/lib/validations/medications';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const body = await request.json();
    const validated = logMedicationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid log parameters' },
        { status: 400 }
      );
    }

    const { medication_id, status, scheduled_time } = validated.data;

    // Check medication exists
    const { data: medication } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('id', medication_id)
      .single();

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    // Insert medication log
    const { data: logData, error: logError } = await adminSupabase
      .from('medication_logs')
      .insert({
        medication_id,
        user_id: medication.user_id,
        status,
        scheduled_time,
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 400 });
    }

    // If taken, decrement stock by 1
    if (status === 'taken' && medication.total_stock > 0) {
      const newStock = medication.total_stock - 1;
      await adminSupabase
        .from('medications')
        .update({ total_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', medication_id);

      // Check if stock alert needed
      if (newStock <= (medication.low_stock_threshold || 5)) {
        await adminSupabase.from('stock_alerts').insert({
          medication_id,
          user_id: medication.user_id,
          message: `Low stock alert: ${medication.name} has only ${newStock} dose(s) remaining!`,
          is_resolved: false,
        });
      }
    }

    // Find circle for audit log
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('id')
      .eq('elder_id', medication.user_id)
      .maybeSingle();

    await logAuditEvent(adminSupabase, {
      circleId: circle?.id,
      actorId: user.id,
      action: 'medication_logged',
      resourceType: 'medication_logs',
      resourceId: logData.id,
      details: {
        medication: medication.name,
        status,
        scheduled_time,
      },
    });

    return NextResponse.json({
      message: 'Medication log recorded successfully',
      log: logData,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const medicationId = searchParams.get('medication_id');
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    let query = adminSupabase
      .from('medication_logs')
      .select('*, medication:medications(name, dosage, time)')
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (medicationId) {
      query = query.eq('medication_id', medicationId);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
