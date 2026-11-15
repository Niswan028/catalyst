'use client';

import React from 'react';
import { getRoleDisplayName } from '@/lib/permissions';

export interface RoleBadgeProps {
  role?: string | null;
  isClinician?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export default function RoleBadge({
  role = 'viewer',
  isClinician = false,
  className = '',
  size = 'sm',
}: RoleBadgeProps) {
  const displayName = getRoleDisplayName(role, isClinician);

  const isDoctor = isClinician || displayName === 'Clinician';
  const isElder = displayName === 'Elder' || displayName === 'Elder Owner';
  const isEditor = displayName === 'Family Editor';

  const colorStyles = isDoctor
    ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
    : isElder
    ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800'
    : isEditor
    ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800'
    : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';

  const dotColors = isDoctor
    ? 'bg-purple-500'
    : isElder
    ? 'bg-teal-500'
    : isEditor
    ? 'bg-sky-500'
    : 'bg-stone-400';

  const sizeStyles =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5'
      : size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs whitespace-nowrap transition-colors ${colorStyles} ${sizeStyles} ${className}`}
      title={`Role: ${displayName}`}
      aria-label={`Role: ${displayName}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} aria-hidden="true" />
      <span>{displayName}</span>
    </span>
  );
}
