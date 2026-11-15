'use client';

import React from 'react';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  status: 'done' | 'current' | 'upcoming' | 'missed';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className = '' }: TimelineProps) {
  const statusStyles = {
    done: {
      dot: 'bg-emerald-500 border-emerald-200 text-white',
      line: 'bg-emerald-200',
    },
    current: {
      dot: 'bg-primary-600 border-primary-200 text-white ring-4 ring-primary-100 animate-pulse',
      line: 'bg-slate-200',
    },
    upcoming: {
      dot: 'bg-slate-200 border-slate-300 text-slate-500',
      line: 'bg-slate-200',
    },
    missed: {
      dot: 'bg-rose-500 border-rose-200 text-white',
      line: 'bg-slate-200',
    },
  };

  return (
    <div className={`space-y-6 relative ${className}`}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const currentStyle = statusStyles[event.status];

        return (
          <div key={event.id} className="relative flex items-start gap-4">
            {/* Vertical connector line */}
            {!isLast && (
              <span
                className={`absolute left-4 top-8 -bottom-6 w-0.5 ${currentStyle.line}`}
                aria-hidden="true"
              />
            )}

            {/* Event Dot / Icon */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${currentStyle.dot}`}
            >
              {event.icon || (event.status === 'done' ? '✓' : index + 1)}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                    {event.time}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {event.title}
                  </h4>
                </div>
                {event.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{event.subtitle}</p>
                )}
              </div>

              {event.action && (
                <button
                  type="button"
                  onClick={event.action.onClick}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition min-h-[32px] shrink-0"
                >
                  {event.action.label}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
