// Active stock and health alerts component for Dashboard
import React from 'react';
import { Button } from '@/components/ui';
import { StockAlert } from '@/lib/types';

interface StockAlertsBannerProps {
  alerts: StockAlert[];
  onResolveAlert: (id: string) => Promise<void>;
}

export default function StockAlertsBanner({ alerts, onResolveAlert }: StockAlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <p className="text-amber-900 font-semibold text-sm">{alert.message}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onResolveAlert(alert.id)}
          >
            Mark Resolved
          </Button>
        </div>
      ))}
    </div>
  );
}
