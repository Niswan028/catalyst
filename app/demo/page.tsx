// Judge Evaluation & Demo Guide: 5-Step Evaluation Tour and Instant Persona Access
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import TestReminderModal from '@/components/TestReminderModal';
import { supabase } from '@/lib/supabase/client';

export default function DemoGuidePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleQuickDemoLogin = async (
    demoEmail: string,
    targetRoute: '/dashboard' | '/caregiver',
    roleTag: string
  ) => {
    setQuickLoginRole(roleTag);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: 'Password123!Secure',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }

      router.push(targetRoute);
      router.refresh();
    } catch {
      // Direct client fallback
      try {
        const { data: fallbackData } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: 'Password123!Secure',
        });
        if (fallbackData?.session) {
          document.cookie = `sb-access-token=${fallbackData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        }
        router.push(targetRoute);
        router.refresh();
      } catch (err) {
        console.error('Login error:', err);
      }
    } finally {
      setQuickLoginRole(null);
    }
  };

  const handleSeedData = async () => {
    setSeedLoading(true);
    setSeedSuccess(null);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedSuccess('Demo database seeded with 5 personas, 4 prescriptions, and CARE-2026 passcode!');
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeedLoading(false);
    }
  };

  const tourSteps = [
    {
      step: 1,
      title: 'Elder Autonomy & "Easy Mode"',
      badge: 'Core Problem Alignment',
      description:
        'Log in as Eleanor Vance. Notice how the elder is the center of their own care. Toggle "Easy Mode" in the dashboard header: text expands to 32px, buttons expand to 48px touch targets, and single-tap "I Took It" dose logging is front and center.',
      actionLabel: 'Log In as Eleanor (Elder)',
      action: () => handleQuickDemoLogin('eleanor.vance.demo@gmail.com', '/dashboard', 'eleanor'),
    },
    {
      step: 2,
      title: 'Passcode Care Circle & Approval Gate',
      badge: 'Secure Family Coordination',
      description:
        'Open the Family Care Circle modal. Notice the active evaluation code CARE-2026 (expires in 7 days). Observe David Vance in "Pending Approval" state, demonstrating that elders hold sovereign control over who joins their circle before any health data is visible.',
      actionLabel: 'View Vance Circle Management',
      action: () => router.push('/dashboard'),
    },
    {
      step: 3,
      title: 'Proactive Email Reminders & Escalation',
      badge: 'Proactive Healthcare',
      description:
        'Trigger a live test reminder using the button below. You can test Upcoming Dose (-15m), Missed Dose Escalation (+15m warning to elder, +60m urgent alert to family circle), and Doctor Appointments. Every dispatch is idempotent and recorded in the audit log.',
      actionLabel: 'Open Live Reminder Dispatcher',
      action: () => setShowTestModal(true),
    },
    {
      step: 4,
      title: 'Doctor Appointments CRUD & .ics Calendar Export',
      badge: 'Full Clinical Lifecycle',
      description:
        'Navigate to Appointments. Notice the scheduled consult with Dr. Anita Patel and eye exam with Dr. Miller. Click "📅 Export .ics" to download an Apple/Google Calendar event with location and doctor notes embedded.',
      actionLabel: 'Go to Appointments Hub',
      action: () => router.push('/appointments'),
    },
    {
      step: 5,
      title: 'Refill Forecasting & Adherence Insights',
      badge: 'Smart Differentiation',
      description:
        'Observe the Refill Widget flagging Atorvastatin (4 doses remaining, threshold 7). Inspect the Adherence Insights card showing a 96% weekly adherence rate, 7-day streak, pattern detection, and prominent "Not medical advice" disclaimer.',
      actionLabel: 'View Insights & Refill Forecast',
      action: () => router.push('/dashboard'),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white rounded-3xl shadow-floating">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-teal-200 mb-3 border border-white/20">
          <span>🏆</span> Round 2 Judge & Evaluator Guide
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight">
          CareConnect Evaluation Portal
        </h1>
        <p className="text-teal-100 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
          Welcome Judges! Use this guided tour to verify every requirement of the problem statement: from secure passcode-based family circles to proactive multi-tier email reminders and elder-centric Easy Mode.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSeedData}
            disabled={seedLoading}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-2"
          >
            <span>{seedLoading ? '⏳' : '🌱'}</span>
            <span>{seedLoading ? 'Seeding Dataset...' : 'Load / Reset Demo Data (1-Click)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-2"
          >
            <span>🔔</span>
            <span>Trigger Test Reminder Live</span>
          </button>
        </div>

        {seedSuccess && (
          <div className="mt-4 p-3 bg-emerald-900/60 border border-emerald-400/60 rounded-xl text-xs font-semibold text-emerald-200">
            ✅ {seedSuccess}
          </div>
        )}
      </div>

      {/* 1-Click Persona Accounts */}
      <div>
        <h2 className="font-serif text-2xl font-normal text-stone-900 dark:text-stone-100 mb-3">
          Instant 1-Click Evaluation Personas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👵</span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Eleanor Vance</h3>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                  Elder Patient / Circle Owner
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              4 active meds • 96% adherence • Easy Mode toggle • Passcode creator
            </p>
            <Button
              onClick={() => handleQuickDemoLogin('eleanor.vance.demo@gmail.com', '/dashboard', 'eleanor')}
              className="w-full text-xs font-bold py-2"
              disabled={quickLoginRole !== null}
            >
              {quickLoginRole === 'eleanor' ? <LoadingSpinner size="sm" /> : 'Enter as Elder →'}
            </Button>
          </Card>

          <Card className="hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👨‍👩‍👧</span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Marcus Vance</h3>
                <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Son / Circle Editor
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Joined via passcode • Can schedule visits & refill prescriptions
            </p>
            <Button
              onClick={() => handleQuickDemoLogin('marcus.caregiver.demo@gmail.com', '/caregiver', 'marcus')}
              variant="secondary"
              className="w-full text-xs font-bold py-2"
              disabled={quickLoginRole !== null}
            >
              {quickLoginRole === 'marcus' ? <LoadingSpinner size="sm" /> : 'Enter as Family Member →'}
            </Button>
          </Card>

          <Card className="hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🩺</span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Dr. Anita Patel, MD</h3>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Clinician / Geriatrician
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Receives missed-dose escalations • Monitors clinical schedules
            </p>
            <Button
              onClick={() => handleQuickDemoLogin('dr.patel.demo@gmail.com', '/caregiver', 'patel')}
              variant="secondary"
              className="w-full text-xs font-bold py-2"
              disabled={quickLoginRole !== null}
            >
              {quickLoginRole === 'patel' ? <LoadingSpinner size="sm" /> : 'Enter as Clinician →'}
            </Button>
          </Card>
        </div>
      </div>

      {/* 5-Step Evaluation Tour */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          5-Step Evaluation Tour
        </h2>

        {/* Step Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tourSteps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeStep === s.step
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>Step {s.step}:</span>
              <span>{s.title.split('&')[0]}</span>
            </button>
          ))}
        </div>

        {/* Active Step Showcase */}
        {tourSteps
          .filter((s) => s.step === activeStep)
          .map((s) => (
            <Card key={s.step} className="border-2 border-primary-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                    {s.badge}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">
                    Step {s.step}: {s.title}
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Step {s.step} of 5
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                {s.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                <Button onClick={s.action} className="py-2.5 px-5 font-bold">
                  {s.actionLabel} →
                </Button>
                {activeStep < 5 && (
                  <Button
                    onClick={() => setActiveStep(activeStep + 1)}
                    variant="secondary"
                    className="py-2.5 px-4 font-semibold"
                  >
                    Next Step ({activeStep + 1}) →
                  </Button>
                )}
              </div>
            </Card>
          ))}
      </div>

      {/* Test Reminder Modal */}
      <TestReminderModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        defaultEmail="eleanor.vance.demo@gmail.com"
      />
    </div>
  );
}
