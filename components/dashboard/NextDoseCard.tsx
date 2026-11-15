// Primary Next Due Medication focus card for Dashboard with live countdown
import React from 'react';
import { Badge } from '@/components/ui';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Medication } from '@/lib/types';

interface NextDoseCardProps {
  upcomingMed: Medication | null;
  isTaken: boolean;
  isLogging: boolean;
  onTakeDose: (med: Medication) => void;
}

export default function NextDoseCard({
  upcomingMed,
  isTaken,
  isLogging,
  onTakeDose,
}: NextDoseCardProps) {
  let countdownText = '';
  if (upcomingMed && !isTaken) {
    const now = new Date();
    const [h, min] = upcomingMed.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h ?? 0, min ?? 0, 0, 0);
    const diffMins = Math.round((target.getTime() - now.getTime()) / 60000);
    if (diffMins > 0) {
      if (diffMins > 60) {
        const hrs = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        countdownText = `⏰ Due in ${hrs}h ${remMins}m`;
      } else {
        countdownText = `⏰ Due in ${diffMins} minutes`;
      }
    } else if (diffMins < 0 && Math.abs(diffMins) <= 60) {
      countdownText = `⚠️ Due ${Math.abs(diffMins)}m ago`;
    } else {
      countdownText = `⏰ Scheduled for ${upcomingMed.time}`;
    }
  }

  return (
    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-lg">
            Next Due Medication
          </span>
          {upcomingMed && (
            <Badge variant={isTaken ? 'success' : 'warning'} dot>
              {isTaken ? 'Confirmed Taken' : 'Upcoming'}
            </Badge>
          )}
        </div>

        {upcomingMed ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{upcomingMed.name}</h3>
              {countdownText && (
                <span className="text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-950 px-2 py-0.5 rounded-full">
                  {countdownText}
                </span>
              )}
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
              Dosage: <strong className="text-slate-900 dark:text-slate-100">{upcomingMed.dosage}</strong>
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              💡 <strong>Instructions:</strong> {upcomingMed.instructions || 'Take with water as prescribed.'}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-6">No scheduled doses remaining for today.</p>
        )}
      </div>

      {upcomingMed && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {isTaken ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2">
              <span>✓</span> Dose Confirmed Taken!
            </div>
          ) : (
            <button
              type="button"
              disabled={isLogging}
              onClick={() => onTakeDose(upcomingMed)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px]"
            >
              {isLogging ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <span>💊</span>
                  <span>I Took My Dose ({upcomingMed.name})</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
