'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';
import { Appointment, AppointmentStatus, User } from '@/lib/types';
import { format } from 'date-fns';

function AppointmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | 'all'>('upcoming');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('upcoming');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUserAndAppointments = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (userData) setUser(userData);

      const url =
        activeFilter === 'all'
          ? '/api/appointments?status=all'
          : `/api/appointments?status=${activeFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, router]);

  useEffect(() => {
    fetchUserAndAppointments();
  }, [fetchUserAndAppointments]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingAppointment(null);
    setDoctorName('');
    setSpecialty('');
    setLocation('');
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setDatetime(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
    setNotes('');
    setStatus('upcoming');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (appt: Appointment) => {
    setEditingAppointment(appt);
    setDoctorName(appt.doctor_name);
    setSpecialty(appt.specialty || '');
    setLocation(appt.location || '');
    try {
      setDatetime(format(new Date(appt.datetime), "yyyy-MM-dd'T'HH:mm"));
    } catch {
      setDatetime(appt.datetime);
    }
    setNotes(appt.notes || '');
    setStatus(appt.status);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!doctorName.trim()) {
      setFormError('Doctor or clinic name is required');
      return;
    }

    if (!datetime) {
      setFormError('Date and time are required');
      return;
    }

    setFormLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        doctor_name: doctorName.trim(),
        specialty: specialty.trim() || null,
        location: location.trim() || null,
        datetime: new Date(datetime).toISOString(),
        notes: notes.trim() || null,
        status,
      };

      const url = editingAppointment
        ? `/api/appointments/${editingAppointment.id}`
        : '/api/appointments';
      const method = editingAppointment ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save appointment');
      } else {
        setShowModal(false);
        fetchUserAndAppointments();
      }
    } catch (err) {
      setFormError('An unexpected network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchUserAndAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (s: AppointmentStatus) => {
    switch (s) {
      case 'upcoming':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">Upcoming</span>;
      case 'done':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-bold">Completed</span>;
      case 'cancelled':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">Cancelled</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Appointments</h1>
          <p className="text-gray-600 text-sm mt-1">
            Keep track of doctor consultations, clinical visits, and medical checkups.
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary" className="py-2.5 px-5 shadow-sm">
          + Schedule Appointment
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        {(['upcoming', 'done', 'cancelled', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`pb-3 px-4 font-semibold text-sm capitalize transition-colors border-b-2 ${
              activeFilter === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab === 'done' ? 'Completed' : tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🗓️</div>
            <h3 className="text-lg font-bold text-gray-800">No {activeFilter} appointments</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Schedule your next visit so you and your family circle receive email reminders.
            </p>
            <Button onClick={openCreateModal} variant="primary">
              Schedule Appointment
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => {
            const dateObj = new Date(appt.datetime);
            const isPast = dateObj.getTime() < Date.now();
            return (
              <Card key={appt.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{appt.doctor_name}</h3>
                    {appt.specialty && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                        {appt.specialty}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="space-y-1.5 text-sm text-gray-700 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📅</span>
                    <span className="font-medium text-gray-900">
                      {format(dateObj, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">⏰</span>
                    <span className="font-semibold text-primary-700">
                      {format(dateObj, 'h:mm a')}
                    </span>
                  </div>
                  {appt.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📍</span>
                      <span>{appt.location}</span>
                    </div>
                  )}
                  {appt.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <strong>Notes:</strong> {appt.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    {appt.status === 'upcoming' && (
                      <button
                        onClick={() => handleStatusUpdate(appt.id, 'done')}
                        className="text-xs bg-green-50 text-green-700 hover:bg-green-100 font-semibold px-3 py-1.5 rounded-lg border border-green-200"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                    {appt.status === 'upcoming' && (
                      <button
                        onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => openEditModal(appt)}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium underline"
                  >
                    Edit Details
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold p-2"
              aria-label="Close modal"
            >
              &times;
            </button>

            <h2 id="appointment-modal-title" className="text-2xl font-bold text-gray-900 mb-4">
              {editingAppointment ? 'Edit Appointment' : 'Schedule Doctor Appointment'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Doctor or Clinic Name *
                </label>
                <Input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Medical Specialty
                </label>
                <Input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiologist, Eye Specialist"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Clinic / Hospital Location
                </label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. City Health Clinic, Room 402"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>

              {editingAppointment && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="done">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes & Preparation
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="e.g. Fasting from midnight, bring previous ECG reports..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="w-1/2"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-1/2"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : editingAppointment ? 'Update' : 'Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
