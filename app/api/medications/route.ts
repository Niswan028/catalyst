// API route for medications with Zod validation, Circle editor support, and audit logging
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { createMedicationSchema, updateMedicationSchema } from '@/lib/validations/medications';
import { checkElderPrivacyPermission } from '@/lib/permissions';
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
    const validated = createMedicationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid medication details' },
        { status: 400 }
      );
    }

    const targetUserId = validated.data.user_id || user.id;

    // If adding on behalf of another user, verify editor permissions
    if (targetUserId !== user.id) {
      const perm = await checkElderPrivacyPermission(
        adminSupabase,
        user.id,
        targetUserId,
        'medications'
      );
      if (!perm.allowed || (perm.role !== 'elder' && perm.role !== 'editor')) {
        return NextResponse.json(
          { error: 'Only elders or approved editors can add medications' },
          { status: 403 }
        );
      }
    }

    // Create medication
    const { data, error } = await adminSupabase
      .from('medications')
      .insert({
        user_id: targetUserId,
        name: validated.data.name,
        dosage: validated.data.dosage,
        time: validated.data.time,
        total_stock: validated.data.total_stock,
        low_stock_threshold: validated.data.low_stock_threshold || 5,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Find circle for audit log
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('id')
      .eq('elder_id', targetUserId)
      .maybeSingle();

    await logAuditEvent(adminSupabase, {
      circleId: circle?.id,
      actorId: user.id,
      action: 'medication_created',
      resourceType: 'medications',
      resourceId: data.id,
      details: { name: data.name, dosage: data.dosage, time: data.time },
    });

    return NextResponse.json({
      message: 'Medication added successfully',
      medication: data,
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
    const targetUserId = searchParams.get('user_id') || user.id;

    if (targetUserId !== user.id) {
      const perm = await checkElderPrivacyPermission(
        adminSupabase,
        user.id,
        targetUserId,
        'medications'
      );
      if (!perm.allowed) {
        return NextResponse.json(
          { error: perm.reason || 'Unauthorized to view medications' },
          { status: 403 }
        );
      }
    }

    const { data, error } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ medications: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const body = await request.json();
    const validated = updateMedicationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid update parameters' },
        { status: 400 }
      );
    }

    const { id, ...updates } = validated.data;

    // Fetch existing medication
    const { data: existingMed } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingMed) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    // Permission check
    if (existingMed.user_id !== user.id) {
      const perm = await checkElderPrivacyPermission(
        adminSupabase,
        user.id,
        existingMed.user_id,
        'medications'
      );
      if (!perm.allowed || (perm.role !== 'elder' && perm.role !== 'editor')) {
        return NextResponse.json(
          { error: 'Only elders or approved editors can update medications' },
          { status: 403 }
        );
      }
    }

    const { data: updatedMed, error: updateError } = await adminSupabase
      .from('medications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('id')
      .eq('elder_id', existingMed.user_id)
      .maybeSingle();

    await logAuditEvent(adminSupabase, {
      circleId: circle?.id,
      actorId: user.id,
      action: 'medication_updated',
      resourceType: 'medications',
      resourceId: id,
      details: updates,
    });

    return NextResponse.json({
      message: 'Medication updated successfully',
      medication: updatedMed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    const { data: existingMed } = await adminSupabase
      .from('medications')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingMed) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    if (existingMed.user_id !== user.id) {
      const perm = await checkElderPrivacyPermission(
        adminSupabase,
        user.id,
        existingMed.user_id,
        'medications'
      );
      if (!perm.allowed || (perm.role !== 'elder' && perm.role !== 'editor')) {
        return NextResponse.json(
          { error: 'Only elders or approved editors can delete medications' },
          { status: 403 }
        );
      }
    }

    // Soft-delete by setting is_active = false
    const { error: deleteError } = await adminSupabase
      .from('medications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('id')
      .eq('elder_id', existingMed.user_id)
      .maybeSingle();

    await logAuditEvent(adminSupabase, {
      circleId: circle?.id,
      actorId: user.id,
      action: 'medication_deleted',
      resourceType: 'medications',
      resourceId: id,
      details: { name: existingMed.name },
    });

    return NextResponse.json({ message: 'Medication removed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
