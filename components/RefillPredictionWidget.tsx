'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';
import { RefillPrediction } from '@/lib/types';
import { format } from 'date-fns';

interface RefillPredictionWidgetProps {
  userId?: string;
}

export default function RefillPredictionWidget({ userId }: RefillPredictionWidgetProps) {
  const [predictions, setPredictions] = useState<RefillPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefillPredictions = useCallback(async () => {
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
        setPredictions(data.refillPredictions || []);
      }
    } catch (err) {
      console.error('Failed to fetch refill predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRefillPredictions();
  }, [fetchRefillPredictions]);

  if (loading) {
    return (
      <Card>
        <div className="py-6 flex justify-center">
          <LoadingSpinner size="sm" />
        </div>
      </Card>
    );
  }

  if (predictions.length === 0) return null;

  return (
    <Card className="shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl" role="img" aria-label="Prescription Pill Bottle">
          💊
        </span>
        <h2 className="text-lg font-bold text-gray-900">Medication Supply & Refill Predictions</h2>
      </div>

      <div className="space-y-3">
        {predictions.map((pred) => (
          <div
            key={pred.medicationId}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              pred.needsUrgentRefill
                ? 'bg-red-50 border-red-200'
                : pred.isLowStock
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base">{pred.medicationName}</span>
                {pred.needsUrgentRefill && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold animate-pulse">
                    ⚠️ Refill Soon
                  </span>
                )}
                {!pred.needsUrgentRefill && pred.isLowStock && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    Low Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Current Stock: <strong>{pred.currentStock} doses</strong> remaining (~
                {pred.daysRemaining} days of supply)
              </p>
            </div>

            <div className="text-right self-end sm:self-center">
              <span className="text-xs text-gray-500 block">Est. Run-Out Date</span>
              <span
                className={`text-sm font-bold ${
                  pred.needsUrgentRefill ? 'text-red-700' : 'text-gray-900'
                }`}
              >
                {format(new Date(pred.predictedRunOutDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
