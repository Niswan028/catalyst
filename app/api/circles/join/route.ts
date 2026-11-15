import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { joinCircleSchema } from '@/lib/validations/circles';
import { verifyPasscode, isInviteValid } from '@/lib/passcode';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  PASSCODE_RATE_LIMIT_CONFIG,
} from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { supabase, user } = authResult;

    // Determine client identifier for rate-limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';
    const rateLimitKey = `passcode:${user.id}:${ip}`;

    // 1. Check rate limit
    const limitStatus = checkRateLimit(rateLimitKey, PASSCODE_RATE_LIMIT_CONFIG);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed passcode attempts. Account locked out for ${Math.ceil(
            limitStatus.retryAfterSeconds / 60
          )} minutes. Please try again later.`,
          retryAfterSeconds: limitStatus.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = joinCircleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid passcode format' },
        { status: 400 }
      );
    }

    const rawPasscode = validated.data.passcode.trim().toUpperCase();
    const prefix = rawPasscode.substring(0, 2);

    // Use service role client to safely search candidate invites across circles
    const adminSupabase = createServiceRoleClient();
    const nowIso = new Date().toISOString();

    const { data: candidateInvites, error: fetchError } = await adminSupabase
      .from('invite_codes')
      .select('*')
      .eq('code_prefix', prefix)
      .eq('is_revoked', false)
      .gte('expires_at', nowIso);

    if (fetchError) {
      console.error('Error fetching invites:', fetchError);
      return NextResponse.json({ error: 'Failed to verify passcode' }, { status: 500 });
    }

    let matchedInvite = null;
    if (candidateInvites && candidateInvites.length > 0) {
      for (const invite of candidateInvites) {
        const matches = await verifyPasscode(rawPasscode, invite.code_hash);
        if (matches) {
          const validity = isInviteValid(invite);
          if (validity.valid) {
            matchedInvite = invite;
            break;
          }
        }
      }
    }

    // If no match found, record failed attempt
    if (!matchedInvite) {
      const failResult = recordFailedAttempt(rateLimitKey, PASSCODE_RATE_LIMIT_CONFIG);
      if (failResult.locked) {
        return NextResponse.json(
          {
            error: `Maximum failed attempts reached. Passcode verification is locked out for 15 minutes.`,
            locked: true,
            retryAfterSeconds: failResult.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      const remaining = PASSCODE_RATE_LIMIT_CONFIG.maxAttempts;
      return NextResponse.json(
        {
          error: 'Invalid, expired, or revoked passcode. Please check the code and try again.',
        },
        { status: 400 }
      );
    }

    // Successful match - reset rate limit
    resetRateLimit(rateLimitKey);

    // Fetch the circle
    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('*, elder:users!care_circles_elder_id_fkey(full_name, email)')
      .eq('id', matchedInvite.circle_id)
      .single();

    if (!circle) {
      return NextResponse.json({ error: 'Care circle no longer exists' }, { status: 404 });
    }

    // Elder cannot join their own circle as caretaker
    if (circle.elder_id === user.id) {
      return NextResponse.json(
        { error: 'You are the elder owner of this Care Circle.' },
        { status: 400 }
      );
    }

    // Check existing membership
    const { data: existingMember } = await adminSupabase
      .from('circle_members')
      .select('*')
      .eq('circle_id', circle.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === 'approved') {
        return NextResponse.json(
          { message: 'You are already an approved member of this Care Circle.', circle },
          { status: 200 }
        );
      }
      if (existingMember.status === 'pending') {
        return NextResponse.json(
          { message: 'Your join request is already pending elder approval.', circle },
          { status: 200 }
        );
      }
      // If revoked, re-request pending approval
      await adminSupabase
        .from('circle_members')
        .update({
          status: 'pending',
          role: matchedInvite.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id);
    } else {
      // Create pending membership
      const { error: insertMemberError } = await adminSupabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          role: matchedInvite.role,
          status: 'pending', // Elder must approve!
          permissions: {
            medications: true,
            appointments: true,
            health_checkins: true,
            voice_messages: true,
          },
          notification_preferences: {
            upcoming_doses: true,
            missed_doses: true,
            appointments: true,
            weekly_digest: true,
          },
        });

      if (insertMemberError) {
        return NextResponse.json({ error: insertMemberError.message }, { status: 400 });
      }
    }

    // Update invite usage
    const newUses = (matchedInvite.uses_count || 0) + 1;
    const isNowRevoked = matchedInvite.max_uses > 0 && newUses >= matchedInvite.max_uses;

    await adminSupabase
      .from('invite_codes')
      .update({
        uses_count: newUses,
        is_revoked: isNowRevoked,
      })
      .eq('id', matchedInvite.id);

    await logAuditEvent(adminSupabase, {
      circleId: circle.id,
      actorId: user.id,
      action: 'member_requested_join',
      resourceType: 'circle_members',
      resourceId: user.id,
      details: {
        role: matchedInvite.role,
        elderName: circle.elder?.full_name,
      },
    });

    return NextResponse.json({
      message: `Passcode accepted! Your request to join ${circle.name} as a ${matchedInvite.role} is submitted and awaiting elder approval.`,
      status: 'pending',
      role: matchedInvite.role,
      circle: {
        id: circle.id,
        name: circle.name,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/circles/join:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
