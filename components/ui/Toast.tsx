'use client';

import React, { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  className = '',
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeConfig: Record<
    ToastType,
    { bg: string; border: string; text: string; icon: string; label: string }
  > = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/80',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'ℹ️',
      label: 'Information',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/80',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: '✅',
      label: 'Success',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/80',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: '⚠️',
      label: 'Warning',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/80',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-100',
      icon: '🛑',
      label: 'Error',
    },
  };

  const current = typeConfig[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">
        {current.icon}
      </span>
      <div className="flex-1 text-sm">
        <span className="sr-only">{current.label}: </span>
        {title && <p className="font-bold leading-tight mb-0.5">{title}</p>}
        <p className="font-medium opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Toast;
