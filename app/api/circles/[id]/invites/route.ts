import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/authServer';
import { createInviteSchema } from '@/lib/validations/circles';
import { generatePasscode, hashPasscode, calculateExpiryDate } from '@/lib/passcode';
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
    const { supabase, user } = authResult;
    const circleId = params.id;

    // Verify user is elder or approved editor
    const { data: circle } = await supabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;
    if (!isElder) {
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role, status')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!membership || membership.role !== 'editor') {
        return NextResponse.json({ error: 'Unauthorized to view invite codes' }, { status: 403 });
      }
    }

    const { data: invites, error } = await supabase
      .from('invite_codes')
      .select('id, circle_id, code_prefix, role, max_uses, uses_count, expires_at, is_revoked, created_at')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (error) {
    console.error('Error in GET /api/circles/[id]/invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { supabase, user } = authResult;
    const circleId = params.id;

    // Verify user is elder or approved editor
    const { data: circle } = await supabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;
    if (!isElder) {
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role, status')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!membership || membership.role !== 'editor') {
        return NextResponse.json(
          { error: 'Only elders or approved editors can create invite passcodes' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validated = createInviteSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid invite parameters' },
        { status: 400 }
      );
    }

    const { role, max_uses, expiry_hours } = validated.data;

    // Generate 6-character random passcode
    const rawPasscode = generatePasscode(6);
    const codeHash = await hashPasscode(rawPasscode);
    const codePrefix = rawPasscode.substring(0, 2);
    const expiresAt = calculateExpiryDate(expiry_hours);

    const { data: newInvite, error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        circle_id: circleId,
        created_by: user.id,
        code_hash: codeHash,
        code_prefix: codePrefix,
        role,
        max_uses,
        uses_count: 0,
        expires_at: expiresAt.toISOString(),
        is_revoked: false,
      })
      .select('id, circle_id, code_prefix, role, max_uses, expires_at, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    await logAuditEvent(supabase, {
      circleId,
      actorId: user.id,
      action: 'invite_code_generated',
      resourceType: 'invite_codes',
      resourceId: newInvite.id,
      details: { role, max_uses, expiry_hours, code_prefix: codePrefix },
    });

    // Return the raw passcode ONCE so user can share it
    return NextResponse.json({
      passcode: rawPasscode,
      invite: newInvite,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/circles/[id]/invites:', error);
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
    const { supabase, user } = authResult;
    const circleId = params.id;
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('invite_id');

    if (!inviteId) {
      return NextResponse.json({ error: 'invite_id query param is required' }, { status: 400 });
    }

    const { data: circle } = await supabase
      .from('care_circles')
      .select('elder_id')
      .eq('id', circleId)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Must be elder or creator of the invite
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('id', inviteId)
      .eq('circle_id', circleId)
      .single();

    if (!invite) {
      return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });
    }

    const isElder = circle.elder_id === user.id;
    const isCreator = invite.created_by === user.id;

    if (!isElder && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized to revoke this invite code' }, { status: 403 });
    }

    const { error: revokeError } = await supabase
      .from('invite_codes')
      .update({ is_revoked: true })
      .eq('id', inviteId);

    if (revokeError) {
      return NextResponse.json({ error: revokeError.message }, { status: 400 });
    }

    await logAuditEvent(supabase, {
      circleId,
      actorId: user.id,
      action: 'invite_code_revoked',
      resourceType: 'invite_codes',
      resourceId: inviteId,
      details: { code_prefix: invite.code_prefix },
    });

    return NextResponse.json({ message: 'Invite passcode revoked successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/circles/[id]/invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
