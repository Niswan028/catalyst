// Medication item card with schedule chips, stock progress bar, refill alerts, and edit/delete actions
import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Medication, DoseStatus } from '@/lib/types';

interface MedicationCardProps {
  medication: Medication;
  onLog: (medicationId: string, status: 'taken' | 'skipped' | 'missed') => void;
  onEdit: (med: Medication) => void;
  onDelete: (medicationId: string) => void;
}

export default function MedicationCard({
  medication: med,
  onLog,
  onEdit,
  onDelete,
}: MedicationCardProps) {
  const isLowStock = med.total_stock <= med.low_stock_threshold;
  const isCriticallyLow = med.total_stock <= 3;

  // Calculate stock bar percentage (assuming a typical 30-day bottle)
  const maxStockReference = Math.max(30, med.total_stock, med.low_stock_threshold * 3);
  const stockPercentage = Math.min(100, Math.round((med.total_stock / maxStockReference) * 100));

  // Determine time of day chip
  const hour = parseInt(med.time.split(':')[0] || '0', 10);
  const timeSlotLabel =
    hour >= 5 && hour < 12
      ? '🌅 Morning'
      : hour >= 12 && hour < 17
      ? '☀️ Afternoon'
      : hour >= 17 && hour < 21
      ? '🌆 Evening'
      : '🌙 Bedtime';

  return (
    <Card className="hover:shadow-md transition-shadow border border-slate-200/90 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Medication Info & Schedule Chips */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {med.name}
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200 font-bold">
              {med.dosage}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
              {timeSlotLabel}
            </span>
          </div>

          {/* Schedule Details */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-400">
              ⏰ Daily at {med.time}
            </span>
            <span>•</span>
            <span>Flexible schedule</span>
            {med.instructions && (
              <>
                <span>•</span>
                <span>{med.instructions}</span>
              </>
            )}
          </div>

          {/* Stock & Refill Alert Bar */}
          <div className="space-y-1.5 pt-1 max-w-md">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>📦 Stock:</span>
                <strong>{med.total_stock} doses left</strong>
              </span>
              {isLowStock ? (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isCriticallyLow
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span>⚠️</span>
                  <span>{isCriticallyLow ? 'Critical Refill' : 'Refill Needed Soon'}</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ Supply Adequate
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isCriticallyLow
                    ? 'bg-rose-500'
                    : isLowStock
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.max(5, stockPercentage)}%` }}
                role="progressbar"
                aria-valuenow={med.total_stock}
                aria-valuemin={0}
                aria-valuemax={maxStockReference}
                aria-label={`Stock level for ${med.name}`}
              />
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              Threshold alert triggers at {med.low_stock_threshold} doses remaining.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-row md:flex-col gap-2 flex-wrap sm:flex-nowrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex gap-2">
            <Button
              onClick={() => onLog(med.id, 'taken')}
              variant="success"
              size="sm"
              className="flex-1 font-bold"
              aria-label={`Log dose of ${med.name} as taken`}
            >
              ✓ Taken
            </Button>
            <Button
              onClick={() => onLog(med.id, 'skipped')}
              variant="secondary"
              size="sm"
              className="flex-1 font-medium"
              aria-label={`Skip dose of ${med.name}`}
            >
              Skip
            </Button>
            <button
              type="button"
              onClick={() => onLog(med.id, 'missed')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
              aria-label={`Mark dose of ${med.name} as missed`}
            >
              Missed
            </button>
          </div>

          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => onEdit(med)}
              className="text-xs text-slate-600 hover:text-primary-600 font-semibold px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(med.id)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
