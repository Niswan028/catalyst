'use client';

import React from 'react';
import { getRoleDisplayName } from '@/lib/permissions';

export interface RoleBadgeProps {
  role?: string | null;
  isClinician?: boolean;
  isFamily?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export default function RoleBadge({
  role = 'viewer',
  isClinician = false,
  isFamily = false,
  className = '',
  size = 'sm',
}: RoleBadgeProps) {
  const displayName = getRoleDisplayName(role, isClinician, isFamily);

  const isDoctor = isClinician || displayName === 'Clinician';
  const isElder = displayName === 'Elder' || displayName === 'Elder Owner';
  const isFamilyMember = isFamily || displayName === 'Family Member' || displayName === 'Family Editor';

  const colorStyles = isDoctor
    ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800'
    : isElder
    ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800'
    : isFamilyMember
    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
    : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';

  const dotColors = isDoctor
    ? 'bg-amber-600'
    : isElder
    ? 'bg-teal-500'
    : isFamilyMember
    ? 'bg-indigo-500'
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
