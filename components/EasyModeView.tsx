'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Medication, User } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

interface EasyModeViewProps {
  user: User;
  medications: Medication[];
  onExitEasyMode: () => void;
  onMedicationLogged?: () => void;
}

export default function EasyModeView({
  user,
  medications,
  onExitEasyMode,
  onMedicationLogged,
}: EasyModeViewProps) {
  const router = useRouter();
  const [activeMedication, setActiveMedication] = useState<Medication | null>(null);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);

  const speakPrompt = useCallback(
    (med: Medication) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `Hello ${user.full_name || ''}. Your dose of ${med.name}, ${med.dosage}, is scheduled for ${med.time}. Tap the large green button when taken.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for elderly clarity
        utterance.onstart = () => setVoiceSpeaking(true);
        utterance.onend = () => setVoiceSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [user.full_name]
  );

  useEffect(() => {
    // Determine the next or current medication
    if (medications.length > 0) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const nowTotal = currentHours * 60 + currentMins;

      // Find first medication whose time is >= current time, or wrap around
      const sorted = [...medications].sort((a, b) => {
        const aParts = a.time.split(':').map(Number);
        const bParts = b.time.split(':').map(Number);
        const aTotal = (aParts[0] ?? 0) * 60 + (aParts[1] ?? 0);
        const bTotal = (bParts[0] ?? 0) * 60 + (bParts[1] ?? 0);
        return aTotal - bTotal;
      });

      const upcoming = sorted.find((m) => {
        const parts = m.time.split(':').map(Number);
        const total = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
        return total >= nowTotal - 30; // Within 30 min past or upcoming
      });

      const nextMed = upcoming || sorted[0] || null;
      setActiveMedication(nextMed);

      // Play voice announcement if available
      if (nextMed) {
        speakPrompt(nextMed);
      }
    }
  }, [medications, speakPrompt]);

  const handleOneTapTake = async () => {
    if (!activeMedication) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...activeMedication.time.split(':').map(Number)
      ).toISOString();

      const res = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          medication_id: activeMedication.id,
          status: 'taken',
          scheduled_time: scheduledTime,
        }),
      });

      if (res.ok) {
        setLoggedSuccess(true);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const confirmation = new SpeechSynthesisUtterance(
            `Great job! Confirmed taken ${activeMedication.name}.`
          );
          window.speechSynthesis.speak(confirmation);
        }
        if (onMedicationLogged) onMedicationLogged();
        setTimeout(() => setLoggedSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to log medication in easy mode:', err);
    }
  };

  return (
    <div className="bg-amber-50 min-h-screen p-4 sm:p-8 flex flex-col justify-between text-black">
      {/* Top Header with high contrast */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border-4 border-black shadow-lg">
        <div>
          <span className="text-xl font-bold uppercase tracking-wider text-primary-800">
            CareConnect • Easy Mode
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black mt-1">
            Welcome, {user.full_name || 'Friend'}!
          </h1>
        </div>

        <button
          onClick={onExitEasyMode}
          className="bg-black text-white hover:bg-gray-800 text-lg font-bold px-6 py-3 rounded-2xl border-2 border-black transition-transform active:scale-95"
          aria-label="Exit Easy Mode and return to standard dashboard"
        >
          ✕ Exit Easy Mode
        </button>
      </header>

      {/* Main Action Area: One-Tap "I took it" */}
      <main className="my-8 max-w-2xl mx-auto w-full">
        {activeMedication ? (
          <div className="bg-white rounded-3xl p-8 border-4 border-black shadow-2xl text-center space-y-6">
            <span className="inline-block bg-yellow-300 text-black text-lg font-black uppercase px-4 py-1.5 rounded-full border-2 border-black">
              Current Dose
            </span>

            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-black">
                {activeMedication.name}
              </h2>
              <p className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                Dosage: {activeMedication.dosage}
              </p>
              <p className="text-3xl font-extrabold text-primary-700 mt-2">
                Time: {activeMedication.time}
              </p>
            </div>

            {loggedSuccess ? (
              <div
                className="bg-green-100 border-4 border-green-600 rounded-3xl p-6 text-green-900 text-3xl font-black animate-bounce"
                role="status"
              >
                ✓ Dose Logged! Great Job!
              </div>
            ) : (
              <button
                onClick={handleOneTapTake}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-3xl sm:text-4xl font-black py-8 px-6 rounded-3xl border-4 border-black shadow-2xl transition-transform active:scale-95 hover:shadow-inner flex items-center justify-center gap-4"
                aria-label={`I Took My Dose - ${activeMedication.name}`}
              >
                <span>💊</span>
                <span>I Took My Dose</span>
              </button>
            )}

            <div className="pt-2">
              <button
                onClick={() => speakPrompt(activeMedication)}
                className="text-lg font-bold text-gray-700 underline flex items-center justify-center gap-2 mx-auto hover:text-black"
                aria-label="Read medication details aloud"
              >
                <span>🔊</span>
                <span>{voiceSpeaking ? 'Speaking...' : 'Read Aloud to Me'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border-4 border-black text-center">
            <h2 className="text-3xl font-bold text-black">No Active Medications</h2>
            <p className="text-xl text-gray-700 mt-2">You are all set for now!</p>
          </div>
        )}
      </main>

      {/* Large navigation shortcuts */}
      <nav aria-label="Large action navigation" className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
        <button
          onClick={() => router.push('/checkin')}
          className="bg-white hover:bg-blue-100 text-black border-4 border-black rounded-3xl p-6 text-center shadow-lg transition-transform active:scale-95"
        >
          <div className="text-4xl mb-1">🎤</div>
          <span className="text-2xl font-black block">Voice Check-In</span>
          <span className="text-base text-gray-600">Tell us how you feel</span>
        </button>

        <button
          onClick={() => router.push('/medications')}
          className="bg-white hover:bg-blue-100 text-black border-4 border-black rounded-3xl p-6 text-center shadow-lg transition-transform active:scale-95"
        >
          <div className="text-4xl mb-1">📋</div>
          <span className="text-2xl font-black block">All Medicines</span>
          <span className="text-base text-gray-600">View complete schedule</span>
        </button>

        <button
          onClick={() => router.push('/appointments')}
          className="bg-white hover:bg-blue-100 text-black border-4 border-black rounded-3xl p-6 text-center shadow-lg transition-transform active:scale-95"
        >
          <div className="text-4xl mb-1">🗓️</div>
          <span className="text-2xl font-black block">Appointments</span>
          <span className="text-base text-gray-600">Doctor visits</span>
        </button>
      </nav>
    </div>
  );
}
