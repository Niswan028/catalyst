'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const [loggingInRole, setLoggingInRole] = useState<'elder' | 'caregiver' | null>(null);

  const handleQuickDemoLogin = async (role: 'elder' | 'caregiver') => {
    setLoggingInRole(role);
    try {
      const email =
        role === 'elder'
          ? 'eleanor.vance.demo@gmail.com'
          : 'marcus.caregiver.demo@gmail.com';
      const password = 'Password123!Secure';

      // 1. Resilient server authentication
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // 2. Synchronize session with browser client
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (role === 'elder') {
        router.push('/dashboard');
      } else {
        router.push('/caregiver');
      }
      router.refresh();
    } catch (err) {
      console.error('Quick demo login error:', err);
      router.push('/auth/signin');
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Sticky Global Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 overflow-x-hidden">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-sm">
              C+
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
                Care<span className="text-primary-600">Connect</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-600 font-semibold block uppercase tracking-wider">
                Elder Healthcare
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/demo"
              className="text-xs sm:text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 sm:px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
            >
              <span>🏆</span>
              <span className="hidden xs:inline">Tour</span>
            </Link>
            <Link
              href="/auth/signin"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-primary-700 px-2 sm:px-3 py-1.5 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm transition active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-800 text-xs sm:text-sm font-bold mb-6 shadow-xs animate-fadeIn">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Smart Passcode Care Circles • Sample demo data</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
              Smarter Medication Schedules.{' '}
              <span className="bg-gradient-to-r from-primary-700 to-teal-600 bg-clip-text text-transparent">
                Elder-Centric Care.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A collaborative healthcare platform where elderly adults, caregivers, and family members
              manage prescriptions, adherence, and doctor appointments through secure passcode-based circles
              with proactive multi-tier email escalations.
            </p>

            {/* Quick 1-Click Demo Buttons */}
            <div className="mt-8 p-5 max-w-xl mx-auto bg-white rounded-2xl border-2 border-primary-200 shadow-floating">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-800 mb-3">
                ⚡ Instant Evaluation: 1-Click Live Demo Access
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loggingInRole !== null}
                  onClick={() => handleQuickDemoLogin('elder')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loggingInRole === 'elder' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span>👵</span>
                      <span>Explore as Eleanor (Elder)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loggingInRole !== null}
                  onClick={() => handleQuickDemoLogin('caregiver')}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loggingInRole === 'caregiver' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span>👨‍⚕️</span>
                      <span>Explore as Marcus (Caregiver)</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2.5">
                Automatically loads active medications, 7-day adherence history, Vance Family Circle, and clinic appointments.
              </p>
            </div>
          </div>
        </section>

        {/* Live Metrics Ticker */}
        <section className="py-8 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  6
                </p>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Core Healthcare Modules
                </span>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-extrabold text-primary-700 tracking-tight">
                  3
                </p>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Languages (EN, HI, TA)
                </span>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  2-Stage
                </p>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email Escalation Chain
                </span>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-extrabold text-emerald-600 tracking-tight">
                  WCAG 2.1 AA
                </p>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Designed Accessibility
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works in 3 Steps */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary-700 uppercase tracking-widest block mb-1">
                Simple & Trustworthy
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                How CareConnect Works in 3 Steps
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Designed to keep the elder in full control of their health without technical friction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-card text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Elder Generates Passcode</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The elder generates a secure 6-8 character expiring passcode (Example passcode: CARE-2026). No complex email verification hurdles for elderly users.
                </p>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-card text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Family Joins & Elder Approves</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Family members or clinicians enter the passcode to request access. The elder approves each member and assigns Viewer or Editor roles.
                </p>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-card text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Proactive Care & Reminders</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Proactive email reminders alert the elder before doses. If missed, automatic escalations alert the family at +15m and +60m.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars Grid */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-primary-700 uppercase tracking-widest mb-2">
              Beyond Basic Reminders
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Six Pillars of Proactive Elderly Care
            </h3>
            <p className="text-slate-600 mt-3 text-base">
              Engineered from the ground up to keep the elderly individual at the center of their own healthcare decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-2xl mb-4">
                🔐
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Passcode Family Circles
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                6-8 character expiring, hashed invite passcodes with dual-axis rate limiting.
                New members land in &ldquo;pending&rdquo; status until the elder approves their role.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4">
                🚨
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                2-Stage Email Escalations
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Proactive notices before doses. Stage 1 alert at +15m overdue to elder and primary caregiver;
                Stage 2 urgent escalation at +60m to all family editors and viewers.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mb-4">
                👓
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Elder &ldquo;Easy Mode&rdquo;
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                32px-48px typography, 12:1+ high contrast, single-tap &ldquo;I Took It&rdquo; logging,
                and Web Speech Synthesis spoken prompts that read medicine details aloud.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-2xl mb-4">
                🗓️
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Appointments & .ics Sync
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Complete doctor visits CRUD with clinic locations, 24h & 2h email reminders, and 1-click
                RFC 5545 `.ics` export with built-in alarms for Apple, Google, and Outlook calendars.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-4">
                🔍
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Adherence Pattern Detection
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Flags frequently missed time slots (e.g. midday doses) with rule-based schedule optimization
                suggestions and mandatory non-medical advice disclaimers.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl mb-4">
                💊
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Refill Depletion Forecasting
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates daily pill consumption and days-to-depletion. Triggers stock alerts before
                prescriptions run out, enabling seamless family circle refill requests.
              </p>
            </div>
          </div>
        </section>

        {/* Sample Evaluation Scenarios */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary-700 uppercase tracking-widest block mb-1">
                Evaluation Profiles
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sample Demo Scenarios & User Roles
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                Explore pre-seeded test data simulating real family coordination workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="inline-block text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full mb-3">
                    Sample Demo Data • Elder
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mb-2">
                    Eleanor Vance (Elder Owner)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Manages 4 active daily medications, tracks adherence with a 96% weekly score, and can activate Easy Mode for high-contrast, 24px+ simplified navigation.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  Features: Easy Mode, Voice check-in, Passcode approval
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="inline-block text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full mb-3">
                    Sample Demo Data • Caregiver
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mb-2">
                    Marcus Vance (Family Editor)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Receives automated +15m and +60m missed-dose alerts, monitors pharmacy refill depletion predictions, and schedules clinic follow-ups.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  Features: 2-stage escalation, Refill alerts, .ics export
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full mb-3">
                    Sample Demo Data • Clinician
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mb-2">
                    Dr. Anita Patel, MD (Clinician)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Monitors medication compliance across linked seniors, reviews daily health check-in summaries, and exports appointments directly to .ics calendars.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                  Features: Clinical oversight, Adherence heatmap, Audit trail
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-extrabold text-sm">
                C+
              </div>
              <span className="font-extrabold text-lg tracking-tight">CareConnect</span>
              <span className="text-xs text-slate-400 border-l border-slate-700 pl-3">
                Elderly Care & Medication Management Platform
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <Link href="/appointments" className="hover:text-white transition">Appointments</Link>
              <Link href="/medications" className="hover:text-white transition">Medications</Link>
              <Link href="/checkin" className="hover:text-white transition">Health Check-In</Link>
              <Link href="/caregiver" className="hover:text-white transition">Caregiver Hub</Link>
              <a
                href="https://github.com/Niswan028/catalyst"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition font-semibold text-primary-400"
              >
                GitHub Repository ↗
              </a>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-2 text-xs text-slate-300">
            <p>
              <strong className="text-white font-semibold">Medical Disclaimer:</strong> CareConnect is an organizational schedule reminder and family coordination platform. It does not provide medical diagnosis, clinical treatment advice, or emergency services. Always consult a licensed healthcare provider for prescription instructions.
            </p>
            <p>
              <strong className="text-white font-semibold">Privacy & Security:</strong> Passcodes are securely hashed with bcrypt (10 rounds). Sample accounts are isolated for evaluation.
            </p>
            <p>
              <strong className="text-white font-semibold">Acknowledgements:</strong> Built on the open-source foundation by{' '}
              <a
                href="https://github.com/S4DIB/careconnect"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition"
              >
                S4DIB
              </a>
              .
            </p>
          </div>

          <div className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© 2026 CareConnect Platform. Designed for WCAG 2.1 AA accessibility standards.</p>
            <p className="text-[11px] text-slate-400">Sample evaluation data pre-configured for review.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
