// Protected Next.js Cron Route for Automated Reminders and Escalations
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/authServer';
import { runAllReminders } from '@/lib/email/reminderEngine';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // If no secret is configured in environment, allow in non-production
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');

  return token === cronSecret || querySecret === cronSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    const adminSupabase = createServiceRoleClient();
    const report = await runAllReminders(adminSupabase);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error) {
    console.error('Error executing cron reminders:', error);
    const message = error instanceof Error ? error.message : 'Unknown cron error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
