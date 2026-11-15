'use client';

import React from 'react';
import Card from '@/components/Card';
import { formatDateTime } from '@/lib/date';
import { CaregiverCheckIn } from '@/hooks/useCaregiverData';

interface CaregiverCheckinsTabProps {
  checkins: CaregiverCheckIn[];
}

export function CaregiverCheckinsTab({ checkins }: CaregiverCheckinsTabProps) {
  return (
    <Card title="Health Check-in History">
      {checkins.length === 0 ? (
        <p className="text-gray-600">No check-ins available yet.</p>
      ) : (
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div key={checkin.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-500">
                  {formatDateTime(checkin.created_at)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                    checkin.mood === 'good' || checkin.mood === 'positive'
                      ? 'bg-green-100 text-green-800'
                      : checkin.mood === 'bad'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {checkin.mood || 'neutral'}
                </span>
              </div>
              <p className="text-gray-800 mb-2 text-sm">{checkin.transcript}</p>
              {checkin.detected_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {checkin.detected_keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
