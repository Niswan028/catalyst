// Caregiver Dashboard - Modular, Clean Architecture
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import JoinCircleModal from '@/components/JoinCircleModal';
import UpcomingAppointmentsWidget from '@/components/UpcomingAppointmentsWidget';
import { supabase } from '@/lib/supabase/client';
import { useCaregiverData } from '@/hooks/useCaregiverData';
import { CaregiverUserSidebar } from '@/components/caregiver/CaregiverUserSidebar';
import { CaregiverOverviewTab } from '@/components/caregiver/CaregiverOverviewTab';
import { CaregiverMedicationsTab } from '@/components/caregiver/CaregiverMedicationsTab';
import { CaregiverCheckinsTab } from '@/components/caregiver/CaregiverCheckinsTab';
import { CaregiverAlertsTab } from '@/components/caregiver/CaregiverAlertsTab';
import { getErrorMessage } from '@/lib/errors';
import { isClinicianUser } from '@/lib/permissions';

export default function CaregiverDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });
  }, []);

  const isClinician = isClinicianUser({
    email: currentUser?.email,
    full_name: currentUser?.user_metadata?.full_name,
    role: currentUser?.user_metadata?.role,
  });
  const {
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
  } = useCaregiverData();

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showJoinPasscodeModal, setShowJoinPasscodeModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  const handleLinkUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLinkLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/caregiver/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ elderly_user_email: linkEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Linked successfully');
        setLinkEmail('');
        setShowLinkForm(false);
        fetchLinkedUsers();
        fetchAlerts();
      } else {
        setError(data.error || 'Failed to link user');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to link user'));
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6dfd3] dark:border-stone-800 pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
            {isClinician ? 'Clinical Care Circle Oversight' : 'Passcode Access & Family Circles'}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            {isClinician ? 'Care Circle Overview' : 'Care Circle Hub'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5">
            {isClinician
              ? 'Supervising clinical records, 7-day adherence trends, and patient appointments.'
              : 'Monitor adherence trends, respond to stock refill alerts, and coordinate doctor visits.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {isClinician ? (
            <Link
              href="/doctor-brief"
              className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <span>📋 Open Doctor Brief</span>
              <span>→</span>
            </Link>
          ) : (
            <>
              <Button
                onClick={() => setShowJoinPasscodeModal(true)}
                className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-bold rounded-xl shadow-xs"
              >
                🔑 Join with Passcode
              </Button>
              <Button variant="secondary" onClick={() => setShowLinkForm(!showLinkForm)}>
                {showLinkForm ? '✕ Close' : 'Email Link'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {showLinkForm && (
        <Card title="Link to Elderly User">
          <p className="text-gray-600 mb-4 text-sm">
            Enter the email address of the elderly user you want to monitor. They must have
            already signed up as an &quot;Elderly User&quot;.
          </p>
          <form onSubmit={handleLinkUser} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="elderly.user@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={linkLoading}>
              {linkLoading ? 'Linking...' : 'Link User'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <CaregiverUserSidebar
            linkedUsers={linkedUsers}
            selectedUser={selectedUser}
            onSelectUser={(u) => setSelectedUser(u)}
            onOpenLinkForm={() => setShowLinkForm(true)}
          />
        </div>

        <div className="lg:col-span-3">
          {selectedUser ? (
            <div className="space-y-6">
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedUser.elderly_user.full_name || 'Unknown User'}
                    </h2>
                    <p className="text-gray-600 text-sm">{selectedUser.elderly_user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() =>
                        router.push(`/doctor-brief?elder=${selectedUser.elderly_user.id}`)
                      }
                      variant="secondary"
                      size="sm"
                      className="border-primary-300 text-primary-800 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 font-semibold"
                    >
                      📋 Doctor Visit Brief →
                    </Button>
                    <Button
                      onClick={() =>
                        router.push(`/messages?user=${selectedUser.elderly_user.id}`)
                      }
                      variant="primary"
                      size="sm"
                    >
                      💬 Send Message
                    </Button>
                    {!isClinician && (
                      <Button
                        onClick={() => handleUnlinkUser(selectedUser.id)}
                        variant="danger"
                        size="sm"
                      >
                        Unlink
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {(['overview', 'medications', 'checkins', 'alerts'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'overview' && '📊 Overview'}
                      {tab === 'medications' && '💊 Medications'}
                      {tab === 'checkins' && '🩺 Check-ins'}
                      {tab === 'alerts' &&
                        `🚨 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Panels */}
              {activeTab === 'overview' && (
                <CaregiverOverviewTab userSummaries={userSummaries} isClinician={isClinician} />
              )}

              {activeTab === 'medications' && (
                <CaregiverMedicationsTab
                  userId={selectedUser.elderly_user.id}
                  medications={medications}
                  adherenceData={adherenceData}
                  adherencePeriod={adherencePeriod}
                  onPeriodChange={setAdherencePeriod}
                />
              )}

              {activeTab === 'checkins' && <CaregiverCheckinsTab checkins={checkins} />}

              {activeTab === 'alerts' && (
                <CaregiverAlertsTab alerts={alerts} onResolveAlert={handleResolveAlert} />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4" role="img" aria-label="Point Left">
                    👈
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a User</h3>
                  <p className="text-gray-600">
                    Click on a linked user to view their health information
                  </p>
                </div>
              </Card>

              <UpcomingAppointmentsWidget canEdit={true} />
            </div>
          )}
        </div>
      </div>

      <JoinCircleModal
        isOpen={showJoinPasscodeModal}
        onClose={() => setShowJoinPasscodeModal(false)}
        onSuccess={() => {
          fetchLinkedUsers();
          fetchAlerts();
        }}
      />
    </div>
  );
}
