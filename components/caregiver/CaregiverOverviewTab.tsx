'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import { formatDate } from '@/lib/date';
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget';
import { CaregiverHealthSummary } from '@/hooks/useCaregiverData';

interface CaregiverOverviewTabProps {
  userSummaries: CaregiverHealthSummary[];
}

export function CaregiverOverviewTab({ userSummaries }: CaregiverOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Clinical Brief Callout */}
      <div className="bg-[#f5f2eb] dark:bg-stone-900 border border-[#e2d9cc] dark:border-stone-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary-800 dark:text-primary-300 block mb-1">
            Clinical Visit Preparation
          </span>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
            One-Page Doctor Visit Brief
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
            Synchronized 7-day adherence, active prescriptions, stock levels, and visit discussion questions.
          </p>
        </div>
        <Link
          href="/doctor-brief"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold rounded-xl shadow-xs transition shrink-0"
        >
          <span>Open Doctor Brief</span>
          <span>→</span>
        </Link>
      </div>

      <Card title="Recent Health Summaries">
        {userSummaries.length === 0 ? (
          <p className="text-gray-600">
            No health summaries available. The user needs to complete daily check-ins.
          </p>
        ) : (
          <div className="space-y-4">
            {userSummaries.map((summary) => (
              <div key={summary.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">
                    {formatDate(summary.date, 'EEEE, MMM dd, yyyy')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {summary.total_checkins} check-in(s)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Mood:</span>
                    <p className="font-medium">{summary.mood_summary || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Symptoms:</span>
                    <p className="font-medium">
                      {summary.symptoms?.length > 0 ? summary.symptoms.join(', ') : 'None detected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Medication:</span>
                    <p className="font-medium">
                      {summary.medication_adherence_rate?.toFixed(0) || 0}% adherence
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <UpcomingAppointmentsWidget canEdit={true} />
    </div>
  );
}
