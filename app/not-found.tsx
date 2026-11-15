'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary-100 text-primary-700 mx-auto flex items-center justify-center text-3xl font-black shadow-inner">
          404
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            We could not find the page you were looking for. It might have moved, or the URL might be mistyped.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🏠</span> Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🌐</span> Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
