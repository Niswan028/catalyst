// Circle security audit logs tab component
import React from 'react';

export interface CircleAuditLogItem {
  id: string;
  action: string;
  created_at: string;
  actor?: {
    full_name?: string;
    email?: string;
  };
  details?: Record<string, unknown> | null;
}

interface CircleAuditTabProps {
  auditLogs: CircleAuditLogItem[];
}

export default function CircleAuditTab({ auditLogs }: CircleAuditTabProps) {
  if (auditLogs.length === 0) {
    return <p className="text-gray-500 text-center py-6">No security events logged yet.</p>;
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {auditLogs.map((log) => (
        <div
          key={log.id}
          className="p-3.5 border rounded-xl bg-gray-50 text-xs flex flex-col gap-1"
        >
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
              {log.action?.replace(/_/g, ' ') || 'ACTION'}
            </span>
            <span className="text-gray-400">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700 mt-1">
            <strong>Actor:</strong> {log.actor?.full_name || log.actor?.email || 'System / Elder'}
          </p>
          {log.details && (
            <p className="text-gray-500 font-mono text-[11px] bg-white p-2 rounded border mt-1">
              {JSON.stringify(log.details)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
