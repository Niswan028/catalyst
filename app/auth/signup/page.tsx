// Sign up page with Elder, Caregiver, and Family role selection and instant validation
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

type UserPersona = 'elder' | 'caregiver' | 'family';

export default function SignUpPage() {
  const router = useRouter();
  const [persona, setPersona] = useState<UserPersona>('elder');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const validateForm = () => {
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      return 'Please enter your full name (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address (e.g., name@example.com).';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    // Map UI persona to database role
    const dbRole: 'elderly_user' | 'caregiver' =
      persona === 'elder' ? 'elderly_user' : 'caregiver';

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          role: dbRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // If elder, suggest onboarding; otherwise route to signin
      const welcomeMsg = encodeURIComponent(
        `Welcome to CareConnect! Your ${persona} account has been created. Please sign in.`
      );
      router.push(`/auth/signin?message=${welcomeMsg}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    const dbRole = persona === 'elder' ? 'elderly_user' : 'caregiver';

    try {
      sessionStorage.setItem('pending_role', dbRole);
      localStorage.setItem('pending_role', dbRole);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${dbRole}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-teal-50 flex items-center justify-center px-4 py-12">
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
            Create your account to start managing care & medication schedules
          </p>
        </div>

        <Card>
          <h2 className="text-xl font-bold mb-4 text-slate-900 text-center">
            Create Your Account
          </h2>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2"
              role="alert"
            >
              <span>🛑</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection - 3 Personas */}
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Account Role">
              <label
                className={`flex items-start p-3 border-2 rounded-xl cursor-pointer transition ${
                  persona === 'elder'
                    ? 'border-primary-600 bg-primary-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  value="elder"
                  checked={persona === 'elder'}
                  onChange={() => setPersona('elder')}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>👵</span> Elder / Senior
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage my own medications, doctor appointments, and daily check-ins.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start p-3 border-2 rounded-xl cursor-pointer transition ${
                  persona === 'caregiver'
                    ? 'border-primary-600 bg-primary-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  value="caregiver"
                  checked={persona === 'caregiver'}
                  onChange={() => setPersona('caregiver')}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>🩺</span> Caregiver / Clinician
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Doctor, nurse, or professional aide overseeing clinical care.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start p-3 border-2 rounded-xl cursor-pointer transition ${
                  persona === 'family'
                    ? 'border-primary-600 bg-primary-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  value="family"
                  checked={persona === 'family'}
                  onChange={() => setPersona('family')}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>👨‍👩‍👧</span> Family Member
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Son, daughter, or spouse joining via passcode to stay informed.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <Input
              label="Full Name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Eleanor Vance"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="eleanor@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              required
            />

            <Button type="submit" className="w-full py-3 font-extrabold mt-2" disabled={loading}>
              {loading ? 'Creating account...' : `Sign Up as ${persona === 'elder' ? 'Elder' : persona === 'caregiver' ? 'Caregiver' : 'Family Member'}`}
            </Button>
          </form>

          {/* Google Sign Up */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400 font-semibold uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            variant="secondary"
            className="w-full flex items-center justify-center gap-3 py-2.5 font-bold"
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>

          <p className="mt-5 text-center text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-bold underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
