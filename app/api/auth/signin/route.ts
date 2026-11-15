// Server-side authentication route for bulletproof sign-in
// Shields browser from ad-blockers, CORS restrictions, and network-level fetch failures
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/authServer';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, AUTH_RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { z } from 'zod';

const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';
    const rateLimitKey = `auth_signin:${ip}`;

    const limitStatus = checkRateLimit(rateLimitKey, AUTH_RATE_LIMIT_CONFIG);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Too many sign in attempts. Please try again in ${Math.ceil(
            limitStatus.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = signinSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid sign in details' },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      recordFailedAttempt(rateLimitKey, AUTH_RATE_LIMIT_CONFIG);
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset rate limit upon successful authentication
    resetRateLimit(rateLimitKey);

    // Fetch user profile from public.users to determine role
    const adminSupabase = createServiceRoleClient();
    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, full_name')
      .eq('id', data.user.id)
      .maybeSingle();

    const response = NextResponse.json({
      message: 'Signed in successfully',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || null,
        role: profile?.role || data.user.user_metadata?.role || 'elderly_user',
      },
    });

    // Set authentication cookie
    response.cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      maxAge: 604800, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[/api/auth/signin] Error:', error);
    const message =
      error instanceof Error
        ? error.message.includes('fetch failed')
          ? 'Unable to connect to authentication server. Please retry in a moment.'
          : error.message
        : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
