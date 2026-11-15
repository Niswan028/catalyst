// Main dashboard page - Calm, Modern Healthcare System
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button, Card, Stat, Badge } from '@/components/ui';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User, DailySummary, Medication, StockAlert } from '@/lib/types';
import { format } from 'date-fns';
import FamilyCircleModal from '@/components/FamilyCircleModal';
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget';
import EasyModeView from '@/components/EasyModeView';
import AdherenceInsightsCard from '@/components/AdherenceInsightsCard';
import RefillPredictionWidget from '@/components/RefillPredictionWidget';
import TestReminderModal from '@/components/TestReminderModal';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [showTestReminderModal, setShowTestReminderModal] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [loggingMedId, setLoggingMedId] = useState<string | null>(null);

  const fetchData = useCallback(async (authUser: any) => {
    try {
      // Fetch user profile
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
            email: authUser.email!,
            role: 'elderly_user',
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          })
          .select()
          .single();

        if (!createError) {
          setUser(newUser);
        }
      } else if (userData) {
        setUser(userData);
      }

      const currentUser = userData || { role: 'elderly_user' };

      if (currentUser?.role === 'elderly_user') {
        const today = format(new Date(), 'yyyy-MM-dd');

        // Fetch today's summary
        const { data: summaryData } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('date', today)
          .maybeSingle();

        setSummary(summaryData);

        // Fetch active medications
        const { data: medsData } = await supabase
          .from('medications')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .order('time');

        setMedications(medsData || []);

        // Fetch today's dose logs
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

        // Fetch unresolved alerts
        const { data: alertsData } = await supabase
          .from('stock_alerts')
          .select('*, medication:medications(*)')
          .eq('user_id', authUser.id)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false });

        setAlerts(alertsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsEasyMode(localStorage.getItem('careconnect_easy_mode') === 'true');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        fetchData(session.user);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && isMounted) {
          fetchData(session.user);
        } else if (event === 'SIGNED_OUT' && isMounted) {
          router.push('/auth/signin');
        }
      });

      setTimeout(async () => {
        const {
          data: { session: retrySession },
        } = await supabase.auth.getSession();
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      console.error('Failed to log dose taken:', err);
    } finally {
      setLoggingMedId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  if (isEasyMode && user.role === 'elderly_user') {
    return (
      <EasyModeView
        user={user}
        medications={medications}
        onExitEasyMode={() => {
          setIsEasyMode(false);
          localStorage.setItem('careconnect_easy_mode', 'false');
        }}
        onMedicationLogged={() => {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) fetchData(data.user);
          });
        }}
      />
    );
  }

  // Find next upcoming dose
  const now = new Date();
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();
  const upcomingMed = medications.find((m) => {
    const [h, min] = m.time.split(':').map(Number);
    const total = (h ?? 0) * 60 + (min ?? 0);
    return total >= currentTotalMins && todayLogs[m.id] !== 'taken';
  }) || medications.find((m) => todayLogs[m.id] !== 'taken') || medications[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white rounded-3xl shadow-floating relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Care Circle Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {user.full_name || 'Eleanor'}!
            </h1>
            <p className="text-teal-100 text-sm sm:text-base mt-1.5 max-w-xl">
              Here is your daily health schedule. Your family circle and caregivers are synchronized in real-time.
            </p>
          </div>

          {user.role === 'elderly_user' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  const next = !isEasyMode;
                  setIsEasyMode(next);
                  localStorage.setItem('careconnect_easy_mode', String(next));
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 shadow-sm transition-transform active:scale-95 flex items-center gap-2 min-h-[44px]"
                aria-label="Switch to Easy Mode for larger text and simplified actions"
              >
                <span>👓</span>
                <span>Easy Mode</span>
              </button>

              <button
                onClick={() => setShowCircleModal(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md shadow-sm transition-transform active:scale-95 flex items-center gap-2 min-h-[44px]"
              >
                <span>👥</span>
                <span>Family Care Circle</span>
              </button>

              <button
                onClick={() => setShowTestReminderModal(true)}
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

      {user.role === 'elderly_user' ? (
        <>
          {/* Active Stock & Health Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert: any) => (
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
                    onClick={async () => {
                      try {
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();
                        if (!session) return;

                        await supabase
                          .from('stock_alerts')
                          .update({ is_resolved: true })
                          .eq('id', alert.id);

                        const { data: alertsData } = await supabase
                          .from('stock_alerts')
                          .select('*, medication:medications(*)')
                          .eq('user_id', user.id)
                          .eq('is_resolved', false)
                          .order('created_at', { ascending: false });

                        setAlerts(alertsData || []);
                      } catch (err) {
                        console.error('Error resolving alert:', err);
                      }
                    }}
                  >
                    Mark Resolved
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats KPI Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Active Prescriptions"
              value={medications.length}
              icon="💊"
              description="Scheduled across today"
            />
            <Stat
              label="Next Dose"
              value={upcomingMed ? upcomingMed.time : 'None'}
              icon="⏰"
              description={upcomingMed ? `${upcomingMed.name} (${upcomingMed.dosage})` : 'All clear for now'}
            />
            <Stat
              label="Today's Check-In"
              value={summary ? 'Completed' : 'Pending'}
              icon="🩺"
              description={summary?.mood_summary ? `Mood: ${summary.mood_summary}` : 'Share how you feel'}
            />
            <Stat
              label="Adherence Rate"
              value={summary?.medication_adherence_rate ? `${summary.medication_adherence_rate.toFixed(0)}%` : '92%'}
              icon="📊"
              trend={{ value: '7-day streak', isPositive: true }}
            />
          </div>

          {/* Action Center: Next Dose Focus & Today Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Action Card */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                    Next Due Medication
                  </span>
                  {upcomingMed && (
                    <Badge variant={todayLogs[upcomingMed.id] === 'taken' ? 'success' : 'warning'} dot>
                      {todayLogs[upcomingMed.id] === 'taken' ? 'Confirmed Taken' : 'Upcoming'}
                    </Badge>
                  )}
                </div>

                {upcomingMed ? (
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-900">{upcomingMed.name}</h3>
                    <p className="text-base text-slate-600 font-medium">
                      Dosage: <strong className="text-slate-900">{upcomingMed.dosage}</strong>
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      💡 <strong>Instructions:</strong> {upcomingMed.instructions || 'Take with water as prescribed.'}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-6">No scheduled doses remaining for today.</p>
                )}
              </div>

              {upcomingMed && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {todayLogs[upcomingMed.id] === 'taken' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-sm font-bold text-emerald-800 flex items-center justify-center gap-2">
                      <span>✓</span> Dose Confirmed Taken!
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={loggingMedId === upcomingMed.id}
                      onClick={() => handleTakeDose(upcomingMed)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      {loggingMedId === upcomingMed.id ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Logging...</span>
                        </>
                      ) : (
                        <>
                          <span>💊</span>
                          <span>I Took My Dose ({upcomingMed.name})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Today Schedule Timeline */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="text-lg font-bold text-slate-900">Today&apos;s Medication Schedule</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push('/medications')}>
                  Manage Schedule
                </Button>
              </div>

              {medications.length > 0 ? (
                <div className="space-y-3">
                  {medications.map((med) => {
                    const isTaken = todayLogs[med.id] === 'taken';
                    return (
                      <div
                        key={med.id}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                          isTaken
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isTaken ? 'bg-emerald-600 text-white' : 'bg-primary-100 text-primary-800'
                            }`}
                          >
                            {isTaken ? '✓' : med.time}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{med.name}</h4>
                            <p className="text-xs text-slate-500">
                              {med.dosage} • {med.frequency || 'Daily'} • Stock: {med.total_stock}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isTaken ? (
                            <Badge variant="success" size="sm">
                              Taken
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTakeDose(med)}
                              disabled={loggingMedId === med.id}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition min-h-[36px]"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">No active medications scheduled.</p>
              )}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/checkin')}>
              <div className="text-center py-2">
                <div className="text-4xl mb-2">🎤</div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Voice Health Check-In</h3>
                <p className="text-slate-500 text-xs mb-3">Speak naturally to record your symptoms and mood</p>
                <Button size="sm" fullWidth onClick={() => router.push('/checkin')}>
                  Start Check-In
                </Button>
              </div>
            </Card>

            <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/appointments')}>
              <div className="text-center py-2">
                <div className="text-4xl mb-2">🗓️</div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Doctor Appointments</h3>
                <p className="text-slate-500 text-xs mb-3">View clinic visits, locations and download .ics</p>
                <Button size="sm" variant="secondary" fullWidth onClick={() => router.push('/appointments')}>
                  View Appointments
                </Button>
              </div>
            </Card>

            <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/messages')}>
              <div className="text-center py-2">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Care Circle Messages</h3>
                <p className="text-slate-500 text-xs mb-3">Send audio notes and stay connected with family</p>
                <Button size="sm" variant="secondary" fullWidth onClick={() => router.push('/messages')}>
                  Open Messages
                </Button>
              </div>
            </Card>
          </div>

          {/* Adherence Insights & Refill Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdherenceInsightsCard />
            <RefillPredictionWidget />
          </div>

          {/* Upcoming Appointments Widget */}
          <UpcomingAppointmentsWidget />
        </>
      ) : (
        <Card>
          <div className="text-center py-10">
            <div className="text-5xl mb-3">👨‍⚕️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Caregiver Dashboard</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
              View and manage your linked elderly family members, medication schedules, and clinic appointments.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push('/caregiver')}>Open Caregiver Hub</Button>
              <Button onClick={() => router.push('/messages')} variant="secondary">
                View Audio Messages
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      {user.role === 'elderly_user' && (
        <>
          <FamilyCircleModal isOpen={showCircleModal} onClose={() => setShowCircleModal(false)} />
          <TestReminderModal
            isOpen={showTestReminderModal}
            onClose={() => setShowTestReminderModal(false)}
            defaultEmail={user.email || ''}
          />
        </>
      )}
    </div>
  );
}
