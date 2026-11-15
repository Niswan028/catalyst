import { NextResponse } from 'next/server';
import { runDemoSeed } from '@/lib/demoSeed';

export async function POST() {
  try {
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

export async function GET() {
  // Allow simple GET requests for status check or programmatic trigger
  return POST();
}
