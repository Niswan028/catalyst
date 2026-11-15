'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';

interface TestReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export default function TestReminderModal({
  isOpen,
  onClose,
  defaultEmail = '',
}: TestReminderModalProps) {
  const [reminderType, setReminderType] = useState<
    'upcoming_dose' | 'missed_dose_15m' | 'missed_dose_60m' | 'appointment_24h' | 'appointment_2h' | 'weekly_digest'
  >('missed_dose_15m');
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setResult({
          success: false,
          message: 'You must be logged in to dispatch test reminders.',
        });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/cron/test-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: reminderType,
          target_email: recipientEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.mocked
            ? `Email simulated successfully in Dev Mock mode! Dispatched "${reminderType}" to ${data.recipientEmail}.`
            : `Email dispatched successfully via SMTP to ${data.recipientEmail}!`,
          details: data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to dispatch test reminder email.',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error dispatching reminder.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'missed_dose_60m':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'missed_dose_15m':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'upcoming_dose':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'appointment_24h':
      case 'appointment_2h':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-reminder-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div>
            <h2 id="test-reminder-title" className="text-xl font-bold flex items-center gap-2">
              <span>🔔</span> Proactive Email Dispatcher
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              Demonstrate automated proactive reminders, escalation levels & digests
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold leading-none p-1 rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Notification Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Reminder Trigger Scenario:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'upcoming_dose',
                  label: '⏰ Upcoming Dose Reminder (15m lead)',
                  desc: 'Sent to elder prior to dose time with dosage and hydration advice',
                },
                {
                  id: 'missed_dose_15m',
                  label: '⚠️ Missed Dose Alert (Level 1: +15m)',
                  desc: 'First alert sent to elder & family circle members',
                },
                {
                  id: 'missed_dose_60m',
                  label: '🚨 Missed Dose ESCALATION (Level 2: +60m)',
                  desc: 'Urgent escalation sent to all editors & viewers',
                },
                {
                  id: 'appointment_24h',
                  label: '🗓️ Appointment Reminder (24h before)',
                  desc: 'Sent with doctor details, clinic location & checklist',
                },
                {
                  id: 'appointment_2h',
                  label: '🚗 Appointment Reminder (2h before)',
                  desc: 'High-priority departure alert for elder & caregivers',
                },
                {
                  id: 'weekly_digest',
                  label: '📊 Weekly Family Circle Digest',
                  desc: 'Adherence rate %, streak metrics, missed doses & doctor visits',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminderType(opt.id as any)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    reminderType === opt.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Email Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Destination Email:
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to default to your logged-in email. In development, messages log to console
              or send via SMTP if configured.
            </p>
          </div>

          {/* Result Alert */}
          {result && (
            <div
              className={`p-4 rounded-xl border text-sm ${
                result.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {result.success ? '✅ Success' : '❌ Failed'}
              </div>
              <p className="mt-1">{result.message}</p>
              {result.details?.messageId && (
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  Message ID: {result.details.messageId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Server Cron Dispatcher Active</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendTest}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Trigger Notification</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
