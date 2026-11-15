import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { updateMemberSchema } from '@/lib/validations/circles';
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
    const circleId = params.id;
    const adminSupabase = createServiceRoleClient();

    // Check user has access to circle
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('*')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;

    if (!isElder) {
      const { data: membership } = await adminSupabase
        .from('circle_members')
        .select('id, status')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to view this circle' }, { status: 403 });
      }
    }

    const { data: members, error } = await adminSupabase
      .from('circle_members')
      .select(`
        id,
        circle_id,
        user_id,
        role,
        status,
        permissions,
        notification_preferences,
        joined_at,
        updated_at,
        user:users!circle_members_user_id_fkey(
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('circle_id', circleId)
      .order('joined_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Error in GET /api/circles/[id]/members:', error);
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
    const circleId = params.id;
    const adminSupabase = createServiceRoleClient();

    // Verify elder ownership
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle || circle.elder_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the elder can approve, update roles, or manage member permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateMemberSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { member_id, status, role, permissions, notification_preferences } = validated.data;

    // Fetch existing member
    const { data: existingMember } = await adminSupabase
      .from('circle_members')
      .select('*')
      .eq('id', member_id)
      .eq('circle_id', circleId)
      .single();

    if (!existingMember) {
      return NextResponse.json({ error: 'Circle member not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (role) updates.role = role;
    if (permissions) {
      updates.permissions = {
        ...(existingMember.permissions || {}),
        ...permissions,
      };
    }
    if (notification_preferences) {
      updates.notification_preferences = {
        ...(existingMember.notification_preferences || {}),
        ...notification_preferences,
      };
    }

    const { data: updatedMember, error: updateError } = await adminSupabase
      .from('circle_members')
      .update(updates)
      .eq('id', member_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      circleId,
      actorId: user.id,
      action: status === 'approved' ? 'member_approved' : 'member_updated',
      resourceType: 'circle_members',
      resourceId: member_id,
      details: { updates },
    });

    return NextResponse.json({
      message: 'Member updated successfully',
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error in PATCH /api/circles/[id]/members:', error);
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
    const circleId = params.id;
    const adminSupabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json({ error: 'member_id query param is required' }, { status: 400 });
    }

    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Check member
    const { data: member } = await adminSupabase
      .from('circle_members')
      .select('*')
      .eq('id', memberId)
      .eq('circle_id', circleId)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Must be either the elder or the member themselves leaving
    const isElder = circle.elder_id === user.id;
    const isSelf = member.user_id === user.id;

    if (!isElder && !isSelf) {
      return NextResponse.json({ error: 'Unauthorized to remove this member' }, { status: 403 });
    }

    // Update status to revoked or delete
    const { error: deleteError } = await adminSupabase
      .from('circle_members')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      circleId,
      actorId: user.id,
      action: isSelf ? 'member_left' : 'member_revoked',
      resourceType: 'circle_members',
      resourceId: memberId,
      details: { targetUserId: member.user_id },
    });

    return NextResponse.json({ message: 'Member access revoked successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/circles/[id]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
