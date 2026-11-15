// Recent past health check-ins list card
import React from 'react';
import Card from '@/components/Card';

interface CheckinRecord {
  id: string;
  created_at: string;
  transcript: string;
  mood?: string;
  detected_keywords?: string[];
}

interface CheckInHistoryCardProps {
  pastCheckins: CheckinRecord[];
}

export default function CheckInHistoryCard({ pastCheckins }: CheckInHistoryCardProps) {
  if (pastCheckins.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <span>📋</span> Recent Health Check-Ins
        </h2>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {pastCheckins.length} recorded
        </span>
      </div>

      <div className="space-y-3.5">
        {pastCheckins.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                  item.mood === 'good' || item.mood === 'positive'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : item.mood === 'neutral'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                Mood: {item.mood || 'Normal'}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed mb-2.5">
              &ldquo;{item.transcript}&rdquo;
            </p>

            {item.detected_keywords && item.detected_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.detected_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase tracking-wider"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
