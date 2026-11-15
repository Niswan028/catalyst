/**
 * Custom hook managing Caregiver Dashboard data fetching and state.
 * Extracts business logic from UI components for testability and maintainability.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export interface LinkedElderUser {
  id: string;
  elderly_user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  };
  created_at: string;
}

export interface CaregiverHealthSummary {
  id: string;
  date: string;
  mood_summary: string | null;
  symptoms: string[];
  medication_adherence_rate: number | null;
  total_checkins: number;
}

export interface CaregiverAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  created_at: string;
}

export interface CaregiverMedication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  total_stock: number;
  low_stock_threshold: number;
}

export interface CaregiverCheckIn {
  id: string;
  transcript: string;
  detected_keywords: string[];
  mood: string;
  created_at: string;
}

export interface AdherenceStatsByMed {
  medication: {
    id: string;
    name: string;
  };
  adherenceRate: number;
  taken: number;
  skipped: number;
  later: number;
}

export interface CaregiverAdherenceReport {
  startDate: string;
  endDate: string;
  overall: {
    adherenceRate: number;
    takenCount: number;
    skippedCount: number;
    laterCount: number;
  };
  byMedication: AdherenceStatsByMed[];
}

export type CaregiverTab = 'overview' | 'medications' | 'checkins' | 'alerts';

const DEMO_LINKED_ELEANOR: LinkedElderUser = {
  id: 'demo-link-eleanor',
  elderly_user: {
    id: '8ce76e37-7e02-4036-9cfb-b5d37520c279',
    email: 'eleanor.vance.demo@gmail.com',
    full_name: 'Eleanor Vance',
    created_at: '2026-01-01T00:00:00Z',
  },
  created_at: '2026-01-01T00:00:00Z',
};

export function useCaregiverData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linkedUsers, setLinkedUsers] = useState<LinkedElderUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LinkedElderUser | null>(null);
  const [activeTab, setActiveTab] = useState<CaregiverTab>('overview');

  // Overview tab data
  const [userSummaries, setUserSummaries] = useState<CaregiverHealthSummary[]>([]);

  // Medications tab data
  const [medications, setMedications] = useState<CaregiverMedication[]>([]);
  const [adherenceData, setAdherenceData] = useState<CaregiverAdherenceReport | null>(null);
  const [adherencePeriod, setAdherencePeriod] = useState<'week' | 'month'>('week');

  // Check-ins tab data
  const [checkins, setCheckins] = useState<CaregiverCheckIn[]>([]);

  // Alerts tab data
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);

  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLinkedUsers = useCallback(async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const isDemoCaregiver =
        session.user.email?.includes('marcus') ||
        session.user.email?.includes('patel');

      if (isDemoCaregiver) {
        setLinkedUsers([DEMO_LINKED_ELEANOR]);
        setSelectedUser((prev) => prev || DEMO_LINKED_ELEANOR);
        setLoading(false);
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/caregiver/links', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.ok) {
        const links: LinkedElderUser[] = data.links || [];
        if (links.length > 0) {
          setLinkedUsers(links);
          setSelectedUser((prev) => prev || links[0] || null);
        } else if (isDemoCaregiver) {
          setLinkedUsers([DEMO_LINKED_ELEANOR]);
          setSelectedUser((prev) => prev || DEMO_LINKED_ELEANOR);
        } else {
          setLinkedUsers([]);
        }
      } else {
        if (!isDemoCaregiver) {
          setError(data.error || 'Failed to fetch linked users');
        }
      }
    } catch (err: unknown) {
      logger.error('Error fetching linked users', { error: err });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [router]);

  const fetchAlerts = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/caregiver/alerts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err: unknown) {
      logger.error('Error fetching alerts', { error: err });
    }
  }, []);

  const fetchUserSummaries = useCallback(async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/summary?user_id=${userId}&limit=7`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUserSummaries(data.summaries || []);
      }
    } catch (err: unknown) {
      logger.error('Error fetching user summaries', { error: err });
    }
  }, []);

  const fetchMedications = useCallback(async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/caregiver/medications?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (err: unknown) {
      logger.error('Error fetching caregiver medications', { error: err });
    }
  }, []);

  const fetchAdherence = useCallback(async (userId: string, period: 'week' | 'month') => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/caregiver/adherence?user_id=${userId}&period=${period}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAdherenceData(data);
      }
    } catch (err: unknown) {
      logger.error('Error fetching adherence', { error: err });
    }
  }, []);

  const fetchCheckins = useCallback(async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/caregiver/checkins?user_id=${userId}&limit=10`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCheckins(data.checkins || []);
      }
    } catch (err: unknown) {
      logger.error('Error fetching checkins', { error: err });
    }
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/caregiver/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ alert_id: alertId }),
      });

      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setSuccess('Alert resolved');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: unknown) {
      logger.error('Error resolving alert', { error: err });
    }
  }, []);

  const handleUnlinkUser = useCallback(
    async (linkId: string) => {
      if (!confirm('Are you sure you want to unlink this user?')) return;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`/api/caregiver/links?id=${linkId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setSuccess('User unlinked successfully');
          setSelectedUser(null);
          fetchLinkedUsers();
          fetchAlerts();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to unlink user'));
      }
    },
    [fetchAlerts, fetchLinkedUsers]
  );

  useEffect(() => {
    fetchLinkedUsers();
    fetchAlerts();
  }, [fetchAlerts, fetchLinkedUsers]);

  useEffect(() => {
    if (selectedUser && activeTab === 'overview') {
      fetchUserSummaries(selectedUser.elderly_user.id);
    } else if (selectedUser && activeTab === 'medications') {
      fetchMedications(selectedUser.elderly_user.id);
      fetchAdherence(selectedUser.elderly_user.id, adherencePeriod);
    } else if (selectedUser && activeTab === 'checkins') {
      fetchCheckins(selectedUser.elderly_user.id);
    }
  }, [selectedUser, activeTab, adherencePeriod, fetchUserSummaries, fetchMedications, fetchAdherence, fetchCheckins]);

  return {
    loading,
    linkedUsers,
    selectedUser,
    setSelectedUser,
    activeTab,
    setActiveTab,
    userSummaries,
    medications,
    adherenceData,
    adherencePeriod,
    setAdherencePeriod,
    checkins,
    alerts,
    error,
    setError,
    success,
    setSuccess,
    fetchLinkedUsers,
    fetchAlerts,
    handleResolveAlert,
    handleUnlinkUser,
  };
}
