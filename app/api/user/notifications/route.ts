import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { z } from 'zod';

const preferencesSchema = z.object({
  circle_id: z.string().uuid(),
  upcoming_doses: z.boolean().optional(),
  missed_doses: z.boolean().optional(),
  appointments: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const circleId = searchParams.get('circle_id');

    const adminSupabase = createServiceRoleClient();

    let query = adminSupabase
      .from('circle_members')
      .select('circle_id, role, status, notification_preferences')
      .eq('user_id', user.id);

    if (circleId) {
      query = query.eq('circle_id', circleId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ preferences: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const validated = preferencesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid preferences' },
        { status: 400 }
      );
    }

    const { circle_id, ...newPrefs } = validated.data;

    // Fetch existing preferences
    const { data: member } = await adminSupabase
      .from('circle_members')
      .select('notification_preferences')
      .eq('circle_id', circle_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    const updated = {
      ...(member.notification_preferences || {}),
      ...newPrefs,
    };

    const { error: updateError } = await adminSupabase
      .from('circle_members')
      .update({ notification_preferences: updated, updated_at: new Date().toISOString() })
      .eq('circle_id', circle_id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
