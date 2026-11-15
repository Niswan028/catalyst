// Audit Log Page - Full Care Circle Access Trail & Security History
'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface AuditRecord {
  id: string;
  circle_id?: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  created_at: string;
  actor?: {
    full_name?: string;
    email?: string;
  };
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get primary circle
      const cRes = await fetch('/api/circles', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const cData = await cRes.json();
      const circleId = cData.circles?.[0]?.id;

      if (circleId) {
        const auditRes = await fetch(`/api/circles/${circleId}/audit`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const auditData = await auditRes.json();
        if (auditData.auditLogs) {
          setLogs(auditData.auditLogs);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && !log.action.includes(filter)) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(query);
      const actorMatch =
        log.actor?.full_name?.toLowerCase().includes(query) ||
        log.actor?.email?.toLowerCase().includes(query);
      return actionMatch || actorMatch;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('passcode') || action.includes('invite')) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
          🔑 Passcode & Invites
        </span>
      );
    }
    if (action.includes('medication')) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
          💊 Prescription
        </span>
      );
    }
    if (action.includes('appointment')) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
          🗓️ Appointment
        </span>
      );
    }
    if (action.includes('member') || action.includes('joined')) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
          👥 Circle Member
        </span>
      );
    }
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
        🛡️ Security Event
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Care Circle Audit Trail</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Tamper-evident record of all care circle actions, passcode generations, and caregiver access.
          </p>
        </div>
        <Button onClick={fetchAuditLogs} variant="secondary" size="sm">
          🔄 Refresh Log
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by actor or action (e.g. passcode, Marcus, Lisinopril)..."
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'passcode', label: 'Passcodes' },
            { id: 'medication', label: 'Medications' },
            { id: 'member', label: 'Members' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filter === item.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table / Feed */}
      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="text-4xl mb-2">🛡️</div>
            <p className="font-bold">No audit entries matching filter</p>
            <p className="text-xs mt-1">Actions performed by elders, caregivers, or passcodes will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>
                      Actor: <strong>{log.actor?.full_name || log.actor?.email || 'System / Auto'}</strong>
                    </span>
                    <span>•</span>
                    <span>Resource: {log.resource_type}</span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-xl">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 sm:text-right flex-shrink-0">
                  {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
