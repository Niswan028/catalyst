// API route for health check-ins with Zod validation
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { detectHealthKeywords, analyzeMood } from '@/utils/healthAnalysis';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

const checkinSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required').max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const body = await request.json();
    const validated = checkinSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid transcript' },
        { status: 400 }
      );
    }

    const { transcript } = validated.data;

    // Analyze transcript
    const detected_keywords = detectHealthKeywords(transcript);
    const mood = analyzeMood(transcript);

    // Save check-in
    const { data, error } = await adminSupabase
      .from('health_checkins')
      .insert({
        user_id: user.id,
        transcript,
        detected_keywords,
        mood,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: circle } = await adminSupabase
      .from('care_circles')
      .select('id')
      .eq('elder_id', user.id)
      .maybeSingle();

    await logAuditEvent(adminSupabase, {
      circleId: circle?.id,
      actorId: user.id,
      action: 'checkin_completed',
      resourceType: 'health_checkins',
      resourceId: data.id,
      details: { mood, keywordsCount: detected_keywords.length },
    });

    return NextResponse.json({
      message: 'Check-in saved successfully',
      checkin: data,
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
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const userId = searchParams.get('user_id') || user.id;

    const { data, error } = await adminSupabase
      .from('health_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ checkins: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
