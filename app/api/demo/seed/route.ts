import { NextRequest, NextResponse } from 'next/server';
import { runDemoSeed } from '@/lib/demoSeed';
import { checkRateLimit, recordFailedAttempt, DEMO_RATE_LIMIT_CONFIG } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';
    const rateLimitKey = `demo_seed:${ip}`;

    const limitStatus = checkRateLimit(rateLimitKey, DEMO_RATE_LIMIT_CONFIG);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Demo seeding rate limit exceeded. Please try again in ${Math.ceil(
            limitStatus.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const result = await runDemoSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Demo seed execution error:', error);
    const message = error instanceof Error ? error.message : 'Unknown seed error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
