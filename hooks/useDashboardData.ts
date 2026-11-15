// Custom hook for managing Dashboard data, state, and medication logging
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, DailySummary, Medication, StockAlert } from '@/lib/types';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

export interface UseDashboardDataResult {
  user: User | null;
  loading: boolean;
  summary: DailySummary | null;
  medications: Medication[];
  todayLogs: Record<string, string>;
  alerts: StockAlert[];
  loggingMedId: string | null;
  handleTakeDose: (med: Medication) => Promise<void>;
  handleSkipDose: (med: Medication) => Promise<void>;
  handleResolveAlert: (alertId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loggingMedId, setLoggingMedId] = useState<string | null>(null);

  const fetchData = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, any> }) => {
    try {
      // 1. Fetch or create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError && userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            role: 'elderly_user',
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          })
          .select()
          .single();

        if (!createError && newUser) {
          setUser(newUser);
        }
      } else if (userData) {
        setUser(userData);
      }

      const currentUserRole = userData?.role || 'elderly_user';

      if (currentUserRole === 'elderly_user') {
        const today = format(new Date(), 'yyyy-MM-dd');

        // 2. Fetch today's summary
        const { data: summaryData } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('date', today)
          .maybeSingle();

        let adherenceRate = summaryData?.medication_adherence_rate;

        // If today's summary adherence is not pre-calculated, derive it from past 7 days of logs
        if (adherenceRate == null) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const { data: weekLogs } = await supabase
            .from('medication_logs')
            .select('status')
            .eq('user_id', authUser.id)
            .gte('logged_at', sevenDaysAgo.toISOString());

          if (weekLogs && weekLogs.length > 0) {
            const taken = weekLogs.filter((l) => l.status === 'taken').length;
            adherenceRate = Math.round((taken / weekLogs.length) * 100);
          }
        }

        setSummary(
          summaryData
            ? { ...summaryData, medication_adherence_rate: adherenceRate ?? summaryData.medication_adherence_rate }
            : adherenceRate != null
            ? {
                id: 'derived-summary',
                user_id: authUser.id,
                date: today,
                mood_summary: 'Feeling active and healthy',
                symptoms: [],
                medication_adherence_rate: adherenceRate,
                total_checkins: 1,
                created_at: new Date().toISOString(),
              }
            : null
        );

        // 3. Fetch active medications
        const { data: medsData } = await supabase
          .from('medications')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .order('time');

        setMedications(medsData || []);

        // 4. Fetch today's dose logs
        const { data: logsData } = await supabase
          .from('medication_logs')
          .select('medication_id, status')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lte('created_at', `${today}T23:59:59.999Z`);

        const logsMap: Record<string, string> = {};
        logsData?.forEach((l) => {
          if (l.medication_id) logsMap[l.medication_id] = l.status;
        });
        setTodayLogs(logsMap);

        // 5. Fetch unresolved stock alerts
        const { data: alertsData } = await supabase
          .from('stock_alerts')
          .select('*, medication:medications(*)')
          .eq('user_id', authUser.id)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false });

        setAlerts(alertsData || []);
      }
    } catch (error) {
      logger.error('Error fetching dashboard data', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchData(session.user);
    }
  }, [fetchData]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        fetchData(session.user);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && isMounted) {
          fetchData(session.user);
        } else if (event === 'SIGNED_OUT' && isMounted) {
          router.push('/auth/signin');
        }
      });

      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user && isMounted) {
          fetchData(retrySession.user);
        } else if (isMounted) {
          setLoading(false);
          router.push('/auth/signin');
        }
      }, 1000);

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchData, router]);

  const handleTakeDose = async (med: Medication) => {
    setLoggingMedId(med.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...med.time.split(':').map(Number)
      ).toISOString();

      const res = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          medication_id: med.id,
          status: 'taken',
          scheduled_time: scheduledTime,
        }),
      });

      if (res.ok) {
        setTodayLogs((prev) => ({ ...prev, [med.id]: 'taken' }));
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Dose confirmed for ${med.name}.`);
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      logger.error('Failed to log dose taken', { error: err });
    } finally {
      setLoggingMedId(null);
    }
  };

  const handleSkipDose = async (med: Medication) => {
    setLoggingMedId(med.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...(med.time.split(':').map(Number) as [number, number])
      ).toISOString();

      const res = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          medication_id: med.id,
          status: 'skipped',
          scheduled_time: scheduledTime,
        }),
      });

      if (res.ok) {
        setTodayLogs((prev) => ({ ...prev, [med.id]: 'skipped' }));
      }
    } catch (err) {
      logger.error('Failed to log dose skipped', { error: err });
    } finally {
      setLoggingMedId(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !user) return;

      await supabase
        .from('stock_alerts')
        .update({ is_resolved: true })
        .eq('id', alertId);

      const { data: alertsData } = await supabase
        .from('stock_alerts')
        .select('*, medication:medications(*)')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      setAlerts(alertsData || []);
    } catch (err) {
      logger.error('Error resolving stock alert', { error: err });
    }
  };

  return {
    user,
    loading,
    summary,
    medications,
    todayLogs,
    alerts,
    loggingMedId,
    handleTakeDose,
    handleSkipDose,
    handleResolveAlert,
    refreshData,
  };
}
