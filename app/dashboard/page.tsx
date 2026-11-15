// Main dashboard page - Calm, Modern Healthcare System
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Stat } from '@/components/ui';
import { Icons } from '@/components/ui/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import FamilyCircleModal from '@/components/FamilyCircleModal';
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget';
import EasyModeView from '@/components/EasyModeView';
import AdherenceInsightsCard from '@/components/AdherenceInsightsCard';
import RefillPredictionWidget from '@/components/RefillPredictionWidget';
import TestReminderModal from '@/components/TestReminderModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHero from '@/components/dashboard/DashboardHero';
import StockAlertsBanner from '@/components/dashboard/StockAlertsBanner';
import NextDoseCard from '@/components/dashboard/NextDoseCard';
import TodayDoseTimeline from '@/components/dashboard/TodayDoseTimeline';
import QuickActionCards from '@/components/dashboard/QuickActionCards';

export default function DashboardPage() {
  const router = useRouter();
  const {
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
  } = useDashboardData();

  const [showCircleModal, setShowCircleModal] = useState(false);
  const [showTestReminderModal, setShowTestReminderModal] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsEasyMode(localStorage.getItem('careconnect_easy_mode') === 'true');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-black mb-4">
          C+
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sign in to Access CareConnect</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm">
          Please sign in to view your medication schedules, adherence logs, and family care circle.
        </p>
        <Button onClick={() => router.push('/auth/signin')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  if (isEasyMode && user.role === 'elderly_user') {
    return (
      <EasyModeView
        user={user}
        medications={medications}
        onExitEasyMode={() => {
          setIsEasyMode(false);
          localStorage.setItem('careconnect_easy_mode', 'false');
        }}
        onMedicationLogged={refreshData}
      />
    );
  }

  // Find next upcoming dose
  const now = new Date();
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();
  const upcomingMed =
    medications.find((m) => {
      const [h, min] = m.time.split(':').map(Number);
      const total = (h ?? 0) * 60 + (min ?? 0);
      return total >= currentTotalMins && todayLogs[m.id] !== 'taken';
    }) ||
    medications.find((m) => todayLogs[m.id] !== 'taken') ||
    medications[0] ||
    null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6">
      {/* Top Hero Banner */}
      <DashboardHero
        user={user}
        isEasyMode={isEasyMode}
        onToggleEasyMode={() => {
          const next = !isEasyMode;
          setIsEasyMode(next);
          localStorage.setItem('careconnect_easy_mode', String(next));
        }}
        onOpenCircleModal={() => setShowCircleModal(true)}
        onOpenTestReminderModal={() => setShowTestReminderModal(true)}
      />

      {user.role === 'elderly_user' ? (
        <>
          {/* Active Stock & Health Alerts */}
          <StockAlertsBanner alerts={alerts} onResolveAlert={handleResolveAlert} />

          {/* Quick Stats KPI Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Active Prescriptions"
              value={medications.length}
              icon={<Icons.Medications size={18} className="text-primary-700" />}
              description="Scheduled across today"
            />
            <Stat
              label="Next Dose"
              value={upcomingMed ? upcomingMed.time : 'None'}
              icon={<Icons.Clock size={18} className="text-amber-600" />}
              description={upcomingMed ? `${upcomingMed.name} (${upcomingMed.dosage})` : 'All clear for now'}
            />
            <Stat
              label="Today's Check-In"
              value={summary ? 'Completed' : 'Pending'}
              icon={<Icons.Checkin size={18} className="text-teal-600" />}
              description={summary?.mood_summary ? `Mood: ${summary.mood_summary}` : 'Share how you feel'}
            />
            <Stat
              label="Adherence Rate"
              value={
                summary?.medication_adherence_rate !== null && summary?.medication_adherence_rate !== undefined
                  ? `${summary.medication_adherence_rate.toFixed(0)}%`
                  : 'No data yet'
              }
              icon={<Icons.Activity size={18} className="text-emerald-600" />}
              trend={
                summary?.medication_adherence_rate
                  ? { value: `${summary.medication_adherence_rate >= 80 ? 'Optimal' : 'Needs attention'}`, isPositive: summary.medication_adherence_rate >= 80 }
                  : undefined
              }
            />
          </div>

          {/* Action Center: Next Dose Focus & Today Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <NextDoseCard
              upcomingMed={upcomingMed}
              isTaken={Boolean(upcomingMed && todayLogs[upcomingMed.id] === 'taken')}
              isLogging={Boolean(upcomingMed && loggingMedId === upcomingMed.id)}
              onTakeDose={handleTakeDose}
            />

            <TodayDoseTimeline
              medications={medications}
              todayLogs={todayLogs}
              loggingMedId={loggingMedId}
              onTakeDose={handleTakeDose}
              onSkipDose={handleSkipDose}
            />
          </div>

          {/* Quick Actions Shortcuts */}
          <QuickActionCards />

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
