'use client';

import React from 'react';

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  label?: string;
  hasData?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  label = 'Adherence',
  hasData = true,
  className = '',
}: ProgressRingProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  const getColor = (val: number) => {
    if (!hasData) return '#94a3b8'; // Slate 400
    if (val >= 85) return '#0d9488'; // Primary Teal
    if (val >= 70) return '#eab308'; // Amber
    return '#e11d48'; // Rose
  };

  const strokeColor = getColor(normalizedProgress);

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={hasData ? normalizedProgress : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${hasData ? `${normalizedProgress}%` : 'No data yet'}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active progress */}
        {hasData && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hasData ? (
          <>
            <span className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
              {Math.round(normalizedProgress)}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
              {label}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-slate-400">No Data</span>
            <span className="text-[10px] text-slate-400">Yet</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ProgressRing;
