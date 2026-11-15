// API route for user signup with Zod validation and rate limiting
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit, recordFailedAttempt, AUTH_RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['elderly_user', 'caregiver']),
  full_name: z.string().max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';
    const rateLimitKey = `auth_signup:${ip}`;

    const limitStatus = checkRateLimit(rateLimitKey, AUTH_RATE_LIMIT_CONFIG);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Too many signup attempts. Please try again in ${Math.ceil(
            limitStatus.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = signupSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid signup details' },
        { status: 400 }
      );
    }

    const { email, password, full_name, role } = validated.data;
    const supabase = createServerClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      recordFailedAttempt(rateLimitKey, AUTH_RATE_LIMIT_CONFIG);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      role,
      full_name: full_name || null,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        full_name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
