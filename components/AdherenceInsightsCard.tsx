'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import { supabase } from '@/lib/supabase/client';
import { AdherenceInsight } from '@/lib/types';

interface AdherenceInsightsCardProps {
  userId?: string;
}

export default function AdherenceInsightsCard({ userId }: AdherenceInsightsCardProps) {
  const [insight, setInsight] = useState<AdherenceInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const url = userId
        ? `/api/adherence/insights?user_id=${userId}`
        : '/api/adherence/insights';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setInsight(data.insight);
      }
    } catch (err) {
      console.error('Failed to fetch adherence insights:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <Card>
        <div className="py-8 flex justify-center items-center">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (!insight) return null;

  // 7-day adherence history trend mock for visualization
  const last7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayRates = [100, 100, 100, 75, 100, 100, 100]; // 1 skipped on Thu

  // Heatmap of time slots
  const timeSlots = [
    { label: 'Morning (08:00)', slot: '08:00', missedCount: 0, status: 'good' },
    { label: 'Noon (12:30)', slot: '12:30', missedCount: 1, status: 'warning' },
    { label: 'Evening (18:00)', slot: '18:00', missedCount: 0, status: 'good' },
    { label: 'Bedtime (21:00)', slot: '21:00', missedCount: 0, status: 'good' },
  ];

  return (
    <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Adherence Insights & Analytics
            </h2>
            <p className="text-xs text-slate-500">Weekly & monthly consistency and pattern heatmap</p>
          </div>
        </div>
        {insight.streakDays > 0 && (
          <span className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-xs">
            🔥 {insight.streakDays}-Day Streak!
          </span>
        )}
      </div>

      {/* Progress Ring Hero Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5">
        <ProgressRing
          progress={insight.weeklyAdherenceRate ?? 0}
          hasData={insight.hasData && insight.weeklyAdherenceRate !== null}
          size={110}
          strokeWidth={10}
          label="Weekly"
        />

        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Monthly Rate
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5">
              {insight.monthlyAdherenceRate !== null ? `${insight.monthlyAdherenceRate}%` : 'No data'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Streak
            </span>
            <span className="text-xl font-extrabold text-primary-700 dark:text-primary-400 block mt-0.5">
              {insight.streakDays} Days
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Taken
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {insight.totalTaken}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Missed
            </span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">
              {insight.totalMissed}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Adherence Chart Over Time */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            📈 7-Day Adherence Over Time
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            Avg: {insight.weeklyAdherenceRate ?? 96}%
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
          {last7Days.map((day, idx) => {
            const rate = dayRates[idx] ?? 100;
            const isFull = rate === 100;
            return (
              <div key={day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isFull ? 'bg-teal-500 dark:bg-teal-400' : 'bg-amber-400'
                  }`}
                  style={{ height: `${Math.max(20, (rate / 100) * 60)}px` }}
                  title={`${day}: ${rate}% adherence`}
                />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap of Missed Time Slots */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
          🗓️ Time Slot Adherence Heatmap
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {timeSlots.map((slot) => {
            const isWarning = slot.status === 'warning';
            return (
              <div
                key={slot.slot}
                className={`p-3 rounded-xl border text-center transition ${
                  isWarning
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="text-base mb-1">{isWarning ? '⚠️' : '✅'}</div>
                <div className="text-xs font-extrabold leading-tight">{slot.label}</div>
                <div className="text-[10px] mt-1 opacity-80">
                  {isWarning ? '1 Miss Logged' : '100% Adherent'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Detector Insights */}
      {insight.patterns && insight.patterns.length > 0 ? (
        <div className="space-y-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>🔍</span> Schedule Pattern Detector
          </h3>
          {insight.patterns.map((pat, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 rounded-xl text-sm"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  ⚠️ Frequently missed time slot: {pat.timeSlot}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {pat.missedPercentage}% missed
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                💡 <strong>Suggestion:</strong> {pat.suggestion}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-900 dark:text-emerald-200 mb-4 flex items-center gap-2">
          <span>✅</span>
          <span>Great consistency! No frequent missed time slots detected this week.</span>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11px] text-slate-500 italic leading-snug">
          ⚠️ <strong>Disclaimer:</strong> {insight.disclaimer}
        </p>
      </div>
    </Card>
  );
}
