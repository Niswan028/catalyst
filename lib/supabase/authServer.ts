import { NextRequest } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Extracts auth token from request header or cookies and returns an authenticated Supabase client
 */
export async function getAuthenticatedContext(
  request: NextRequest
): Promise<AuthenticatedContext | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization');
  
  // Try to also read access token from cookie if header is not present
  const cookieHeader = request.headers.get('cookie') || '';
  let tokenFromCookie: string | null = null;
  const match = cookieHeader.match(/sb-access-token=([^;]+)/);
  if (match && match[1]) {
    tokenFromCookie = decodeURIComponent(match[1]);
  }

  const token = authHeader?.replace(/^Bearer\s+/i, '') || tokenFromCookie;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token || undefined);

  if (error || !user) {
    return { error: 'Unauthorized: Invalid or missing authentication session', status: 401 };
  }

  return { supabase, user };
}

/**
 * Creates a service role Supabase client for administrative/cron tasks
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
