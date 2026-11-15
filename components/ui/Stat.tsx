'use client';

import React from 'react';

export interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function Stat({
  label,
  value,
  icon,
  trend,
  description,
  className = '',
}: StatProps) {
  return (
    <div
      className={`p-5 sm:p-6 bg-white dark:bg-stone-900 rounded-2xl border border-[#e6dfd3] dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-3xl lg:text-4xl font-normal text-stone-900 dark:text-stone-100 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold flex items-center ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-600 mt-1 font-medium">{description}</p>
      )}
    </div>
  );
}

export default Stat;
