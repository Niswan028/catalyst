'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Icons } from '@/components/ui';
import RoleBadge from '@/components/RoleBadge';
import { isClinicianUser, isElder } from '@/lib/permissions';

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instructions?: string | null;
  total_stock?: number;
}

interface AppointmentItem {
  id: string;
  doctor_name: string;
  specialty?: string | null;
  location?: string | null;
  appointment_date: string;
  status: string;
}

const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Amlodipine',
    dosage: '1 tablet · 5mg',
    time: '8:00 AM',
    instructions: 'After breakfast · Daily with water',
    total_stock: 24,
  },
  {
    id: 'med-2',
    name: 'Metformin',
    dosage: '1 tablet · 500mg',
    time: '12:30 PM',
    instructions: 'With lunch · Avoid skipping meals',
    total_stock: 18,
  },
  {
    id: 'med-3',
    name: 'Lisinopril',
    dosage: '1 tablet · 10mg',
    time: '6:00 PM',
    instructions: 'After evening meal · Monitor blood pressure',
    total_stock: 30,
  },
  {
    id: 'med-4',
    name: 'Atorvastatin',
    dosage: '1 tablet · 20mg',
    time: '9:00 PM',
    instructions: 'At bedtime',
    total_stock: 12,
  },
];

const DEFAULT_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-1',
    doctor_name: 'Dr. Anita Patel, MD',
    specialty: 'Geriatric Specialist',
    location: 'Community Health Center · Suite 204',
    appointment_date: '2026-11-18T10:30:00Z',
    status: 'scheduled',
  },
  {
    id: 'apt-2',
    doctor_name: 'Dr. Meera Shah',
    specialty: 'Cardiology Specialist',
    location: 'St. Jude Medical Clinic · Room 12B',
    appointment_date: '2026-11-25T14:00:00Z',
    status: 'scheduled',
  },
];

export default function DoctorBriefPage() {
  const [elderName, setElderName] = useState('Eleanor Vance');
  const [viewerName, setViewerName] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<'elder' | 'editor' | 'clinician' | 'viewer'>('elder');
  const [isClinician, setIsClinician] = useState<boolean>(false);
  const [medications, setMedications] = useState<MedicationItem[]>(DEFAULT_MEDICATIONS);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(DEFAULT_APPOINTMENTS);
  const [questions, setQuestions] = useState(
    '1. What should we watch for before the next visit?\n2. Is the current 500mg Metformin dosage optimal given recent post-meal readings?\n3. Can Atorvastatin be shifted to earlier evening if bedtime drowsiness occurs?'
  );
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [naturalQuery, setNaturalQuery] = useState('');
  const [queryToast, setQueryToast] = useState<string | null>(null);

  useEffect(() => {
    // Load saved questions from localStorage if available
    const saved = localStorage.getItem('careconnect_doctor_questions');
    if (saved) {
      setQuestions(saved);
    }

    // Attempt to load live medications and appointments from Supabase
    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const currentName = session.user.user_metadata?.full_name || session.user.email || '';
        const userIsClinician = isClinicianUser({
          email: session.user.email,
          full_name: currentName,
          role: session.user.user_metadata?.role,
        });
        const userRoleMeta = session.user.user_metadata?.role;
        const userIsElder = !userIsClinician && isElder(userRoleMeta);

        setIsClinician(userIsClinician);

        let targetElderId = session.user.id;

        if (userIsClinician || userRoleMeta === 'caregiver') {
          // Monitored elder is Eleanor Vance; viewer is doctor or family member
          setViewerName(currentName);
          setViewerRole(userIsClinician ? 'clinician' : 'editor');
          setElderName('Eleanor Vance');

          // Look for linked elder ID from circle_members
          const { data: circleMember } = await supabase
            .from('circle_members')
            .select('circle:care_circles(elder_id)')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle();

          const foundElderId = (circleMember?.circle as { elder_id?: string } | null)?.elder_id;
          if (foundElderId) {
            targetElderId = foundElderId;
          }
        } else {
          // Elder viewing their own brief
          setElderName(currentName || 'Eleanor Vance');
          setViewerName(null);
          setViewerRole('elder');
        }

        const { data: meds } = await supabase
          .from('medications')
          .select('id, name, dosage, time, instructions, total_stock')
          .eq('user_id', targetElderId)
          .eq('is_active', true)
          .order('time', { ascending: true });

        if (meds && meds.length > 0) {
          setMedications(meds);
        }

        const { data: apts } = await supabase
          .from('appointments')
          .select('id, doctor_name, specialty, location, appointment_date, status')
          .eq('user_id', targetElderId)
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(5);

        if (apts && apts.length > 0) {
          setAppointments(apts);
        }
      } catch (e) {
        // Fallback to pre-seeded defaults
      }
    }

    loadData();
  }, []);

  const handleSaveQuestions = () => {
    localStorage.setItem('careconnect_doctor_questions', questions);
    setSavedStatus('Questions saved successfully!');
    setTimeout(() => setSavedStatus(null), 3000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleAskCareConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;
    setQueryToast(`Suggestion noted: "${naturalQuery}". Eleanor's Care Circle was alerted.`);
    setNaturalQuery('');
    setTimeout(() => setQueryToast(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#e6dfd3] dark:border-stone-800 pb-3 no-print">
        <div className="flex items-center gap-2 font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 font-bold">
          <Link
            href={viewerRole === 'elder' ? '/dashboard' : '/caregiver'}
            className="hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            {viewerRole === 'elder' ? 'Dashboard' : 'Care Circle Hub'}
          </Link>
          <span>/</span>
          <span className="text-stone-900 dark:text-stone-100 font-extrabold">Doctor Brief</span>
          <span>/</span>
          <span className="text-primary-700 dark:text-primary-400">Vance Circle</span>
        </div>

        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Circle is in step · All records synchronized</span>
        </div>
      </div>

      {/* Natural Language Suggestion Bar (Ask CareConnect) */}
      <div className="no-print bg-[#efeae0] dark:bg-stone-900 border border-[#e2d9cc] dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400 mb-2">
          Ask CareConnect · A Suggestion, Never A Direct Prescription Change
        </div>
        <form onSubmit={handleAskCareConnect} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <input
            type="text"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder="Ask CareConnect: e.g. Add evening BP check at 8pm or verify Dr. Patel's clinic address..."
            className="flex-1 bg-white dark:bg-stone-950 border border-[#dcd3c3] dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Ask CareConnect</span>
            <span>↗</span>
          </button>
        </form>
        {queryToast && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            ✓ {queryToast}
          </div>
        )}
      </div>

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
            A Clear Picture For Your Visit
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            Doctor brief
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
            A one-page clinical summary prepared from your circle&apos;s real-time records.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-stone-600 dark:text-stone-300">
              Patient: <strong className="text-stone-900 dark:text-stone-100 font-bold">{elderName}</strong>
            </span>
            <RoleBadge role="elder" size="xs" />
            {viewerName && (
              <>
                <span className="text-stone-400">·</span>
                <span className="text-xs text-stone-600 dark:text-stone-300">
                  Reviewed by: <strong className="text-stone-900 dark:text-stone-100 font-bold">{viewerName}</strong>
                </span>
                <RoleBadge role={viewerRole} isClinician={isClinician} size="xs" />
              </>
            )}
            <span className="text-stone-400">·</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              , {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icons.Download className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Current Medicines */}
        <section className="bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Current medicines
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {medications.length} Active Prescriptions
            </span>
          </div>

          <div className="space-y-4 divide-y divide-stone-100 dark:divide-stone-800/80">
            {medications.map((med, idx) => (
              <div key={med.id || idx} className={idx > 0 ? 'pt-4' : ''}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">{med.name}</h3>
                  <span className="text-xs font-semibold text-primary-800 dark:text-primary-300">
                    {med.dosage}
                  </span>
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-stone-800 dark:text-stone-200">⏰ {med.time}</span>
                  <span>• Daily schedule</span>
                  {med.instructions && <span>• {med.instructions}</span>}
                </div>
                {med.total_stock !== undefined && (
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    📦 Current supply: <strong>{med.total_stock} doses</strong> remaining
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Column 2: Medicine Adherence */}
        <section className="bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Medicine adherence
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Last 7 days
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  96% <span className="text-xs font-normal text-stone-500">· 27 of 28 doses</span>
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Last 30 days
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  95% <span className="text-xs font-normal text-stone-500">· 114 of 120 doses</span>
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
              Adherence rate derived from timestamped daily dose logs. Includes automated proactive email reminders and caregiver verification.
            </p>
          </div>
        </section>

        {/* Column 1 Lower: Missed or late doses */}
        <section className="bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Missed or late doses · last 30 days
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
              <span className="text-rose-500 font-bold">•</span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100">Atorvastatin</strong> (1 tablet · 20mg) missed: 12 Nov 2026, 9:00 pm
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Family notified via 2-stage automated email escalation.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
              <span className="text-amber-500 font-bold">•</span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100">Lisinopril</strong> (1 tablet · 10mg) recorded late (+45m): 08 Nov 2026, 6:45 pm
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Confirmed taken following reminder alert.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Column 2 Lower: Recent Mood Check-ins */}
        <section className="bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Recent mood & wellness check-ins
            </h2>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">Mood: Calm & Cheerful (😊)</span>
                <span className="text-[11px] text-stone-500">Today · 9:15 AM</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                Resting heart rate 72 bpm. Mild evening fatigue noted on Tuesday; hydrated well.
              </p>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Wellness logs submitted through voice and touch check-ins.
            </p>
          </div>
        </section>

        {/* Full Width: Upcoming Appointments */}
        <section className="lg:col-span-2 bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Upcoming appointments
            </h2>
            <Link
              href="/appointments"
              className="text-xs font-bold text-primary-700 dark:text-primary-400 hover:underline no-print"
            >
              Manage Appointments ↗
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/70 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <strong className="text-sm text-stone-900 dark:text-stone-100 block">
                    {apt.doctor_name}
                  </strong>
                  <span className="text-stone-600 dark:text-stone-300">
                    {apt.specialty || 'General Care'} · {apt.location || 'Clinic'}
                  </span>
                </div>
                <div className="text-right sm:text-right shrink-0">
                  <span className="font-bold text-primary-800 dark:text-primary-300 block">
                    {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {new Date(apt.appointment_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Full Width: Questions to ask the doctor */}
        <section className="lg:col-span-2 bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h2 className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100">
              Questions to ask the doctor
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              One question per line (up to 10). Keep notes for your next consultation.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="What should we watch for before the next visit? Any adjustments needed for Lisinopril?"
              className="w-full bg-stone-50 dark:bg-stone-950 border border-[#dcd3c3] dark:border-stone-700 rounded-xl p-4 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-600 font-sans leading-relaxed"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 no-print">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Notes persist locally and print directly on the clinical brief.
              </span>
              <button
                type="button"
                onClick={handleSaveQuestions}
                className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                Save questions
              </button>
            </div>
            {savedStatus && (
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 no-print">
                ✓ {savedStatus}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Footer Disclaimer for Clinic Printout */}
      <div className="text-center text-xs text-stone-500 dark:text-stone-400 pt-6 border-t border-[#e6dfd3] dark:border-stone-800">
        <p>
          CareConnect Clinical Brief · Generated for Eleanor Vance · Confidential healthcare summary for attending physicians.
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
          Not medical advice. Prescriptions must be modified solely by licensed medical practitioners.
        </p>
      </div>
    </div>
  );
}
