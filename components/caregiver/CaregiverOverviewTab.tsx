'use client';

import React from 'react';
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
