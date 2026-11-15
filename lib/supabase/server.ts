// Supabase client for server-side (API routes)
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DEFAULTS } from '@/lib/constants';

export const createServerClient = () => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUrl =
    rawUrl && !rawUrl.includes('placeholder') ? rawUrl : SUPABASE_DEFAULTS.URL;
  const supabaseAnonKey =
    rawAnonKey && !rawAnonKey.includes('placeholder')
      ? rawAnonKey
      : SUPABASE_DEFAULTS.ANON_KEY;

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
      },
    }
  );
};

