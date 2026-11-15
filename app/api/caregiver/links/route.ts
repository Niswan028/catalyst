// API route for caregiver links (updated for Care Circles and Passcode-based access)
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Direct email linking has been upgraded to Passcode-based family circles
    return NextResponse.json(
      {
        error:
          'Direct email linking has been upgraded to secure Passcode-based access. Please ask the elder for an invite passcode and use the "Join Family Circle" feature.',
        actionRequired: 'USE_PASSCODE',
      },
      { status: 400 }
    );
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
    const { supabase, user } = authResult;
    const adminSupabase = createServiceRoleClient();

    // 1. Fetch approved circle memberships
    const { data: circleMemberships } = await adminSupabase
      .from('circle_members')
      .select(`
        id,
        role,
        status,
        permissions,
        created_at:joined_at,
        circle:care_circles(
          id,
          name,
          elder_id,
          elder:users!care_circles_elder_id_fkey(
            id,
            email,
            full_name,
            role,
            created_at
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'approved');

    // 2. Fetch legacy caregiver links (if any)
    const { data: legacyLinks } = await supabase
      .from('caregiver_links')
      .select('*, elderly_user:users!caregiver_links_elderly_user_id_fkey(id, email, full_name, role, created_at)')
      .eq('caregiver_id', user.id);

    interface CircleMembershipItem {
      id: string;
      role: string;
      permissions: Record<string, boolean>;
      created_at: string;
      circle: {
        id: string;
        name: string;
        elder_id: string;
        elder: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          created_at: string;
        };
      } | null;
    }

    const memberships = (circleMemberships || []) as unknown as CircleMembershipItem[];
    const formattedCircleLinks = memberships
      .filter((m) => m.circle && m.circle.elder)
      .map((m) => ({
        id: m.id,
        caregiver_id: user.id,
        elderly_user_id: m.circle!.elder.id,
        elderly_user: m.circle!.elder,
        role: m.role,
        permissions: m.permissions,
        circle_id: m.circle!.id,
        circle_name: m.circle!.name,
        created_at: m.created_at,
      }));

    // Merge without duplicates
    const seenElderIds = new Set(formattedCircleLinks.map((l) => l.elderly_user_id));
    const mergedLinks = [...formattedCircleLinks];

    if (legacyLinks) {
      for (const link of legacyLinks) {
        if (link.elderly_user && !seenElderIds.has(link.elderly_user_id)) {
          seenElderIds.add(link.elderly_user_id);
          mergedLinks.push(link);
        }
      }
    }

    return NextResponse.json({ links: mergedLinks });
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
    const { supabase, user } = authResult;

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Attempt to delete from circle_members or caregiver_links
    await supabase.from('circle_members').delete().eq('id', linkId).eq('user_id', user.id);
    await supabase.from('caregiver_links').delete().eq('id', linkId).eq('caregiver_id', user.id);

    return NextResponse.json({ message: 'Link removed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
