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

  return (
    <Card className="shadow-card border border-slate-200/80">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Adherence Insights
            </h2>
            <p className="text-xs text-slate-500">Weekly & monthly consistency</p>
          </div>
        </div>
        {insight.streakDays > 0 && (
          <span className="text-xs bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs">
            🔥 {insight.streakDays}-Day Streak!
          </span>
        )}
      </div>

      {/* Progress Ring Hero Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-5">
        <ProgressRing
          progress={insight.weeklyAdherenceRate ?? 0}
          hasData={insight.hasData && insight.weeklyAdherenceRate !== null}
          size={110}
          strokeWidth={10}
          label="Weekly"
        />

        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Monthly Rate
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
              {insight.monthlyAdherenceRate !== null ? `${insight.monthlyAdherenceRate}%` : 'No data'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Streak
            </span>
            <span className="text-xl font-extrabold text-primary-700 block mt-0.5">
              {insight.streakDays} Days
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Taken
            </span>
            <span className="text-xl font-extrabold text-emerald-600 block mt-0.5">
              {insight.totalTaken}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Missed
            </span>
            <span className="text-xl font-extrabold text-rose-600 block mt-0.5">
              {insight.totalMissed}
            </span>
          </div>
        </div>
      </div>

      {/* Pattern Detector Insights */}
      {insight.patterns && insight.patterns.length > 0 ? (
        <div className="space-y-3 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>🔍</span> Schedule Pattern Detector
          </h3>
          {insight.patterns.map((pat, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-sm"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-amber-900">
                  ⚠️ Frequently missed time slot: {pat.timeSlot}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {pat.missedPercentage}% missed
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                💡 <strong>Suggestion:</strong> {pat.suggestion}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 mb-4 flex items-center gap-2">
          <span>✅</span>
          <span>Great consistency! No frequent missed time slots detected this week.</span>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 italic leading-snug">
          ⚠️ <strong>Disclaimer:</strong> {insight.disclaimer}
        </p>
      </div>
    </Card>
  );
}
