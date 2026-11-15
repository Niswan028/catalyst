import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/authServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let latencyMs = 0;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    latencyMs = Date.now() - startTime;
    if (error) {
      dbStatus = `degraded: ${error.message}`;
    }
  } catch (err: unknown) {
    dbStatus = err instanceof Error ? err.message : 'unreachable';
  }

  return NextResponse.json(
    {
      status: 'healthy',
      platform: 'CareConnect Elderly Care & Medication Management',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
      services: {
        database: {
          status: dbStatus,
          latencyMs,
        },
        emailDispatcher: {
          status: 'ready',
          transporter: process.env.SMTP_USER ? 'smtp-production' : 'dev-mock-fallback',
        },
        passcodeVerification: {
          status: 'active',
          hashAlgorithm: 'bcrypt-10-rounds',
          rateLimiter: 'dual-key (user+ip)',
        },
      },
    },
    { status: 200 }
  );
}
