// Supabase client for browser
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DEFAULTS } from '@/lib/constants';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Bulletproof fallback to production Supabase project ensures zero fetch failures on Netlify
const supabaseUrl =
  rawUrl && !rawUrl.includes('placeholder') ? rawUrl : SUPABASE_DEFAULTS.URL;
const supabaseAnonKey =
  rawAnonKey && !rawAnonKey.includes('placeholder')
    ? rawAnonKey
    : SUPABASE_DEFAULTS.ANON_KEY;

export const createBrowserClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );
};

// Simple client for use anywhere
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
);

// Sync auth tokens to cookies for Next.js middleware and server-side navigation
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    } else if (event === 'SIGNED_OUT') {
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    }
  });
}

