'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-card border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 mx-auto flex items-center justify-center text-3xl shadow-sm">
          ⚠️
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            An unexpected error occurred while loading this page. Your health data and schedules remain secure.
          </p>
          {error.message && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono text-left break-all">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm transition active:scale-95"
          >
            🔄 Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200 transition active:scale-95"
          >
            🏠 Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
