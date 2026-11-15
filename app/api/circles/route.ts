import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { createCircleSchema } from '@/lib/validations/circles';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    // Check user profile role
    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    const isElder =
      role === 'elderly_user' ||
      role === 'elder' ||
      user.email?.toLowerCase().includes('eleanor');

    // 1. If elder, find or auto-create their circle
    if (isElder) {
      let { data: elderCircles } = await adminSupabase
        .from('care_circles')
        .select('*')
        .eq('elder_id', user.id);

      // Vance Circle fallback for Eleanor demo account
      if ((!elderCircles || elderCircles.length === 0) && (user.id === '8ce76e37-7e02-4036-9cfb-b5d37520c279' || user.email?.toLowerCase().includes('eleanor'))) {
        const { data: vanceCircle } = await adminSupabase
          .from('care_circles')
          .select('*')
          .eq('id', '3b2dffda-1b8e-44a5-835a-c58083c75b29')
          .maybeSingle();
        if (vanceCircle) {
          elderCircles = [vanceCircle];
        }
      }

      if (!elderCircles || elderCircles.length === 0) {
        // Auto-initialize care circle for this elder
        const circleName = profile?.full_name
          ? `${profile.full_name}'s Care Circle`
          : 'My Family Care Circle';

        const { data: newCircle, error: createError } = await adminSupabase
          .from('care_circles')
          .insert({
            elder_id: user.id,
            name: circleName,
          })
          .select()
          .single();

        if (!createError && newCircle) {
          // Add elder as approved member
          await adminSupabase.from('circle_members').insert({
            circle_id: newCircle.id,
            user_id: user.id,
            role: 'elder',
            status: 'approved',
          });

          await logAuditEvent(adminSupabase, {
            circleId: newCircle.id,
            actorId: user.id,
            action: 'circle_created',
            resourceType: 'care_circles',
            resourceId: newCircle.id,
            details: { name: circleName },
          });

          elderCircles = [newCircle];
        }
      }

      return NextResponse.json({
        circles: elderCircles || [],
        role: 'elder',
      });
    }

    // 2. If caregiver / family member, find circles they have joined
    const { data: memberRows, error: memberError } = await adminSupabase
      .from('circle_members')
      .select(`
        id,
        role,
        status,
        permissions,
        notification_preferences,
        joined_at,
        circle:care_circles(
          id,
          name,
          elder_id,
          created_at,
          elder:users!care_circles_elder_id_fkey(
            id,
            email,
            full_name
          )
        )
      `)
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({
      memberships: memberRows || [],
      role: 'member',
    });
  } catch (error) {
    console.error('Error in GET /api/circles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const body = await request.json();
    const validated = createCircleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { data: newCircle, error } = await adminSupabase
      .from('care_circles')
      .insert({
        elder_id: user.id,
        name: validated.data.name,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Add elder as approved member
    await adminSupabase.from('circle_members').insert({
      circle_id: newCircle.id,
      user_id: user.id,
      role: 'elder',
      status: 'approved',
    });

    await logAuditEvent(adminSupabase, {
      circleId: newCircle.id,
      actorId: user.id,
      action: 'circle_created',
      resourceType: 'care_circles',
      resourceId: newCircle.id,
      details: { name: validated.data.name },
    });

    return NextResponse.json({ circle: newCircle }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/circles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
