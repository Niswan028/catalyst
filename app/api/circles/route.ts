import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/authServer';
import { createCircleSchema } from '@/lib/validations/circles';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { supabase, user } = authResult;

    // Check user profile role
    const { data: profile } = await supabase
      .from('users')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single();

    // 1. If elder, find or auto-create their circle
    if (profile?.role === 'elderly_user') {
      let { data: elderCircles } = await supabase
        .from('care_circles')
        .select('*')
        .eq('elder_id', user.id);

      if (!elderCircles || elderCircles.length === 0) {
        // Auto-initialize care circle for this elder
        const circleName = profile.full_name
          ? `${profile.full_name}'s Care Circle`
          : 'My Family Care Circle';

        const { data: newCircle, error: createError } = await supabase
          .from('care_circles')
          .insert({
            elder_id: user.id,
            name: circleName,
          })
          .select()
          .single();

        if (!createError && newCircle) {
          // Add elder as approved member
          await supabase.from('circle_members').insert({
            circle_id: newCircle.id,
            user_id: user.id,
            role: 'elder',
            status: 'approved',
          });

          await logAuditEvent(supabase, {
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
    const { data: memberRows, error: memberError } = await supabase
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
    const { supabase, user } = authResult;

    const body = await request.json();
    const validated = createCircleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { data: newCircle, error } = await supabase
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
    await supabase.from('circle_members').insert({
      circle_id: newCircle.id,
      user_id: user.id,
      role: 'elder',
      status: 'approved',
    });

    await logAuditEvent(supabase, {
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
