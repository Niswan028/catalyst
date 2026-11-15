// Hero banner component for Dashboard
import React from 'react';
import { User } from '@/lib/types';

interface DashboardHeroProps {
  user: User;
  isEasyMode: boolean;
  onToggleEasyMode: () => void;
  onOpenCircleModal: () => void;
  onOpenTestReminderModal: () => void;
}

export default function DashboardHero({
  user,
  isEasyMode,
  onToggleEasyMode,
  onOpenCircleModal,
  onOpenTestReminderModal,
}: DashboardHeroProps) {
  const curHour = new Date().getHours();
  const greeting = curHour < 12 ? 'Good morning' : curHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white rounded-3xl shadow-floating relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Care Circle Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            {greeting}, {user.full_name || 'Eleanor'}!
          </h1>
          <p className="text-teal-100 text-sm sm:text-base mt-1.5 max-w-xl">
            Here is your daily health schedule. Your family circle and caregivers are synchronized in real-time.
          </p>
        </div>

        {user.role === 'elderly_user' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onToggleEasyMode}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 shadow-sm transition-transform active:scale-95 flex items-center gap-2 min-h-[44px]"
              aria-label="Switch to Easy Mode for larger text and simplified actions"
            >
              <span>👓</span>
              <span>Easy Mode</span>
            </button>

            <button
              onClick={onOpenCircleModal}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md shadow-sm transition-transform active:scale-95 flex items-center gap-2 min-h-[44px]"
            >
              <span>👥</span>
              <span>Family Care Circle</span>
            </button>

            <button
              onClick={onOpenTestReminderModal}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-500/80 hover:bg-blue-500 text-white border border-blue-400/40 shadow-sm transition-transform active:scale-95 flex items-center gap-2 min-h-[44px]"
              title="Test proactive email reminders (upcoming dose, missed dose escalation, appointments)"
            >
              <span>🔔</span>
              <span>Test Reminders</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
