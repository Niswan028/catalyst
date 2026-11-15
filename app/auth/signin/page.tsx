// Sign in page with 1-Click Demo Evaluation Profiles
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getPostAuthRedirect } from '@/lib/roles';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleLoadDemoData = async () => {
    setSeedLoading(true);
    setSeedSuccess(null);
    setError('');
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedSuccess('Demo data populated! 5 accounts, prescriptions, and Care Circle ready.');
      } else {
        setError(data.error || 'Failed to seed demo data');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error connecting to demo seed endpoint';
      setError(msg);
    } finally {
      setSeedLoading(false);
    }
  };

  // Handle OAuth callback and check authentication status
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (window.location.hash) {
        router.push('/auth/callback' + window.location.hash);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
        router.refresh();
      }
    };

    handleAuthCallback();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Direct browser authentication with Supabase client (fastest & reliable)
      const { data: clientData, error: clientError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (!clientError && clientData?.session) {
        document.cookie = `sb-access-token=${clientData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        const userRole = clientData.user?.user_metadata?.role;
        const targetRoute = getPostAuthRedirect(userRole, redirectParam);
        router.push(targetRoute);
        router.refresh();
        return;
      }

      // 2. Server route fallback if client-side request was blocked (e.g. adblocker)
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const serverData = await res.json();
      if (!res.ok) {
        throw new Error(serverData.error || clientError?.message || 'Failed to sign in');
      }

      if (serverData.session) {
        await supabase.auth.setSession({
          access_token: serverData.session.access_token,
          refresh_token: serverData.session.refresh_token,
        });
        document.cookie = `sb-access-token=${serverData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }

      const targetRoute = getPostAuthRedirect(serverData.user?.role, redirectParam);
      router.push(targetRoute);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in';
      const isInvalidCreds =
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid credentials') ||
        msg.toLowerCase().includes('invalid email or password') ||
        msg.toLowerCase().includes('wrong password') ||
        msg.toLowerCase().includes('user not found');

      setError(
        isInvalidCreds
          ? 'Invalid email or password. Please verify your credentials and try again.'
          : msg.includes('fetch failed')
          ? 'Network connectivity issue. Please check your connection and retry.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (
    demoEmail: string,
    targetRoute: '/dashboard' | '/caregiver',
    roleTag: string
  ) => {
    setError('');
    setQuickLoginRole(roleTag);
    try {
      // 1. Direct browser client sign-in with pre-seeded demo credentials
      const { data: clientData, error: clientError } =
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: 'Password123!Secure',
        });

      if (!clientError && clientData?.session) {
        document.cookie = `sb-access-token=${clientData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        router.push(targetRoute);
        router.refresh();
        return;
      }

      // 2. Resilient server route fallback
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: 'Password123!Secure',
        }),
      });

      const serverData = await res.json();
      if (!res.ok) {
        throw new Error(
          serverData.error || clientError?.message || 'Failed to sign in with demo account'
        );
      }

      if (serverData.session) {
        await supabase.auth.setSession({
          access_token: serverData.session.access_token,
          refresh_token: serverData.session.refresh_token,
        });
        document.cookie = `sb-access-token=${serverData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }

      router.push(targetRoute);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with demo account';
      setError(
        msg.includes('fetch failed')
          ? 'Network connectivity issue. Please click "Load Demo Data" above to re-sync or retry in a moment.'
          : msg
      );
    } finally {
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-700 to-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              C+
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              Care<span className="text-primary-600">Connect</span>
            </span>
          </Link>
          <p className="text-sm font-medium text-slate-600">
            Elderly Care & Medication Management Platform
          </p>
        </div>

        {/* 1-Click Evaluation Demo Logins Card */}
        <div className="bg-white/90 backdrop-blur-md border-2 border-primary-200 rounded-2xl p-5 shadow-floating">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ⚡ Instant 1-Click Demo Logins
            </span>
            <button
              type="button"
              onClick={handleLoadDemoData}
              disabled={seedLoading}
              className="text-[11px] font-bold text-primary-800 bg-primary-100 hover:bg-primary-200 border border-primary-300 px-2.5 py-1 rounded-full transition flex items-center gap-1 shadow-xs"
              title="Populates Eleanor, Marcus, Dr. Patel, Prescriptions, Appointments, and CARE-2026 Passcode"
            >
              {seedLoading ? '⏳ Seeding...' : '🌱 Load Demo Data'}
            </button>
          </div>
          {seedSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <span>✅</span>
              <span>{seedSuccess}</span>
            </div>
          )}
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Select a verified persona to test the platform with full pre-seeded prescriptions, adherence history, care circles, and appointment data:
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={quickLoginRole !== null}
              onClick={() =>
                handleQuickDemoLogin('eleanor.vance.demo@gmail.com', '/dashboard', 'eleanor')
              }
              className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200 text-slate-900 font-bold transition flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👵</span>
                <div>
                  <div className="text-sm font-extrabold text-teal-950 flex items-center gap-2">
                    Eleanor Vance
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-200 text-teal-900">
                      Elder Owner
                    </span>
                  </div>
                  <div className="text-xs text-teal-700 font-medium">
                    4 active meds • 96% adherence • Easy Mode toggle
                  </div>
                </div>
              </div>
              {quickLoginRole === 'eleanor' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="text-xs font-black text-teal-700 group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={quickLoginRole !== null}
              onClick={() =>
                handleQuickDemoLogin('marcus.caregiver.demo@gmail.com', '/caregiver', 'marcus')
              }
              className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-slate-900 font-bold transition flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍⚕️</span>
                <div>
                  <div className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                    Marcus Vance
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">
                      Son / Editor
                    </span>
                  </div>
                  <div className="text-xs text-indigo-700 font-medium">
                    Linked to Eleanor • Refill alerts & appointment editor
                  </div>
                </div>
              </div>
              {quickLoginRole === 'marcus' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="text-xs font-black text-indigo-700 group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={quickLoginRole !== null}
              onClick={() =>
                handleQuickDemoLogin('dr.patel.demo@gmail.com', '/caregiver', 'patel')
              }
              className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-slate-900 font-bold transition flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <div className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    Dr. Anita Patel, MD
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Clinician
                    </span>
                  </div>
                  <div className="text-xs text-amber-800 font-medium">
                    Geriatric specialist • Schedule & dose oversight
                  </div>
                </div>
              </div>
              {quickLoginRole === 'patel' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="text-xs font-black text-amber-800 group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Standard Sign In Card */}
        <Card>
          <h2 className="text-xl font-bold mb-5 text-slate-900 text-center">
            Sign In with Existing Account
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eleanor.vance.demo@gmail.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full py-3 font-extrabold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to CareConnect'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-primary-600 hover:text-primary-700 font-bold underline"
            >
              Sign Up for Free
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
