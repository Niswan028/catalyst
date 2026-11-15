'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
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
        <div className="py-6 flex justify-center">
          <LoadingSpinner size="sm" />
        </div>
      </Card>
    );
  }

  if (!insight) return null;

  return (
    <Card className="shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Insights">
            📊
          </span>
          <h2 className="text-lg font-bold text-gray-900">Medication Adherence Insights</h2>
        </div>
        {insight.streakDays > 0 && (
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
            🔥 {insight.streakDays}-Day Streak!
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
          <span className="text-xs text-gray-600 block">Weekly Adherence</span>
          <span
            className={`text-2xl font-black ${
              insight.weeklyAdherenceRate >= 80 ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {insight.weeklyAdherenceRate}%
          </span>
        </div>

        <div className="p-3 bg-purple-50 rounded-xl text-center border border-purple-100">
          <span className="text-xs text-gray-600 block">Monthly Rate</span>
          <span className="text-2xl font-black text-purple-700">
            {insight.monthlyAdherenceRate}%
          </span>
        </div>

        <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100">
          <span className="text-xs text-gray-600 block">Doses Taken</span>
          <span className="text-2xl font-black text-green-700">{insight.totalTaken}</span>
        </div>

        <div className="p-3 bg-rose-50 rounded-xl text-center border border-rose-100">
          <span className="text-xs text-gray-600 block">Doses Missed</span>
          <span className="text-2xl font-black text-rose-700">{insight.totalMissed}</span>
        </div>
      </div>

      {/* Pattern Detector Insights */}
      {insight.patterns && insight.patterns.length > 0 ? (
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span>🔍</span> Schedule Pattern Detector
          </h3>
          {insight.patterns.map((pat, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-sm"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-amber-900">
                  ⚠️ Frequently missed time slot: {pat.timeSlot}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {pat.missedPercentage}% missed
                </span>
              </div>
              <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">
                💡 <strong>Suggestion:</strong> {pat.suggestion}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 mb-4">
          ✓ Great consistency! No frequent missed time slots detected this week.
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 italic leading-snug">
          ⚠️ <strong>Disclaimer:</strong> {insight.disclaimer}
        </p>
      </div>
    </Card>
  );
}
