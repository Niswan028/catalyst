'use client';

import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatDateTime } from '@/lib/date';
import { CaregiverAlert } from '@/hooks/useCaregiverData';

interface CaregiverAlertsTabProps {
  alerts: CaregiverAlert[];
  onResolveAlert: (id: string) => void;
}

export function CaregiverAlertsTab({ alerts, onResolveAlert }: CaregiverAlertsTabProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Card title="All Alerts & Notifications">
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4" role="img" aria-label="Success">
            ✅
          </div>
          <p className="text-gray-600 font-medium">No alerts! Everything looks good.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-4 border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {alert.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{alert.message}</p>
                  <p className="text-xs opacity-75">{formatDateTime(alert.created_at)}</p>
                </div>
                {alert.type === 'low_stock' && (
                  <Button size="sm" variant="secondary" onClick={() => onResolveAlert(alert.id)}>
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
