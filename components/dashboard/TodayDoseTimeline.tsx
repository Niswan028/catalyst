// Today's Medication Schedule Timeline component with large Taken/Skip buttons & status indicators
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '@/components/ui';
import { Medication } from '@/lib/types';

interface TodayDoseTimelineProps {
  medications: Medication[];
  todayLogs: Record<string, string>;
  loggingMedId: string | null;
  onTakeDose: (med: Medication) => void;
  onSkipDose?: (med: Medication) => void;
}

export default function TodayDoseTimeline({
  medications,
  todayLogs,
  loggingMedId,
  onTakeDose,
  onSkipDose,
}: TodayDoseTimelineProps) {
  const router = useRouter();

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Today&apos;s Medication Schedule
          </h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.push('/medications')}>
          Manage Schedule
        </Button>
      </div>

      {medications.length > 0 ? (
        <div className="space-y-3">
          {medications.map((med) => {
            const status = todayLogs[med.id];
            const isTaken = status === 'taken';
            const isSkipped = status === 'skipped';
            const isMissed = status === 'missed';
            const isPending = !isTaken && !isSkipped && !isMissed;

            return (
              <div
                key={med.id}
                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isTaken
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : isSkipped
                    ? 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
                    : isMissed
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                      isTaken
                        ? 'bg-emerald-600 text-white animate-in zoom-in-90'
                        : isSkipped
                        ? 'bg-slate-300 text-slate-700'
                        : isMissed
                        ? 'bg-rose-600 text-white'
                        : 'bg-primary-100 text-primary-800'
                    }`}
                  >
                    {isTaken ? '✓' : isSkipped ? '—' : isMissed ? '!' : med.time}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        {med.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/50">
                        {med.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daily at {med.time} • Stock: {med.total_stock} left
                      {med.instructions ? ` • ${med.instructions}` : ''}
                    </p>
                  </div>
                </div>

                {/* Dose Actions / Status Badge */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isTaken ? (
                    <Badge variant="success" size="sm" dot>
                      Taken Today
                    </Badge>
                  ) : isSkipped ? (
                    <Badge variant="secondary" size="sm">
                      Skipped
                    </Badge>
                  ) : isMissed ? (
                    <Badge variant="danger" size="sm" dot>
                      Missed
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onTakeDose(med)}
                        disabled={loggingMedId === med.id}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 shadow-sm min-h-[44px] flex items-center gap-1.5"
                        aria-label={`Mark ${med.name} as taken`}
                      >
                        <span>✓</span>
                        <span>{loggingMedId === med.id ? 'Logging...' : 'Taken'}</span>
                      </button>

                      {onSkipDose && (
                        <button
                          type="button"
                          onClick={() => onSkipDose(med)}
                          disabled={loggingMedId === med.id}
                          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 min-h-[44px]"
                          aria-label={`Skip ${med.name}`}
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-8 text-center">No active medications scheduled.</p>
      )}
    </div>
  );
}
