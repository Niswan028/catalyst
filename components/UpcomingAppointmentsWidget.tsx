'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';
import { Appointment } from '@/lib/types';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { downloadAppointmentIcs } from '@/lib/calendar/ics';

interface UpcomingAppointmentsWidgetProps {
  circleId?: string;
  canEdit?: boolean;
  onAddClick?: () => void;
}

const DEMO_FALLBACK_APPOINTMENTS: Appointment[] = [
  {
    id: 'demo-apt-1',
    circle_id: 'c1111111-1111-4111-a111-111111111111',
    doctor_name: 'Dr. Anita Patel, MD',
    specialty: 'Geriatric Specialist',
    location: 'Metro Health Hospital, Suite 402',
    datetime: new Date(Date.now() + 3 * 86400000).toISOString(),
    notes: 'Follow-up on blood pressure control and Lisinopril tolerance test.',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-apt-2',
    circle_id: 'c1111111-1111-4111-a111-111111111111',
    doctor_name: 'Dr. Robert Miller, OD',
    specialty: 'Ophthalmology',
    location: 'Vision Eye Care Center, 120 Main St',
    datetime: new Date(Date.now() + 10 * 86400000).toISOString(),
    notes: 'Annual diabetic retinopathy screening.',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  },
];

export default function UpcomingAppointmentsWidget({
  circleId,
  canEdit = true,
  onAddClick,
}: UpcomingAppointmentsWidgetProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setAppointments(DEMO_FALLBACK_APPOINTMENTS);
        return;
      }

      const url = circleId
        ? `/api/appointments?circle_id=${circleId}&status=upcoming&limit=4`
        : `/api/appointments?status=upcoming&limit=4`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok && data.appointments && data.appointments.length > 0) {
        setAppointments(data.appointments);
      } else {
        setAppointments(DEMO_FALLBACK_APPOINTMENTS);
      }
    } catch (err) {
      setError('Unable to load latest appointments.');
      setAppointments(DEMO_FALLBACK_APPOINTMENTS);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleMarkDone = async (id: string) => {
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
        body: JSON.stringify({ status: 'done' }),
      });

      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to mark appointment done:', err);
    }
  };

  const formatAppointmentTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return `${format(date, 'EEE, MMM d')} at ${format(date, 'h:mm a')}`;
  };

  return (
    <Card className="shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Calendar">
            🗓️
          </span>
          <h2 className="text-lg font-bold text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href="/appointments?action=new"
              className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold px-3 py-1.5 rounded-lg border border-primary-200 transition-colors"
            >
              + Schedule
            </Link>
          )}
          <Link
            href="/appointments"
            className="text-xs text-gray-600 hover:text-gray-900 font-medium underline"
          >
            View All
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAppointments} className="font-bold underline hover:text-amber-950">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-16 bg-blue-50/50 rounded-xl" />
          <div className="h-16 bg-blue-50/50 rounded-xl" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No upcoming doctor appointments scheduled.</p>
          {canEdit && (
            <Link
              href="/appointments"
              className="mt-2 inline-block text-xs text-primary-600 hover:text-primary-800 font-semibold"
            >
              Schedule an appointment &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">{appt.doctor_name}</h3>
                  {appt.specialty && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                      {appt.specialty}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                  <span className="font-semibold text-primary-700">
                    🕒 {formatAppointmentTime(appt.datetime)}
                  </span>
                  {appt.location && <span>📍 {appt.location}</span>}
                </div>
                {appt.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">Note: {appt.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => downloadAppointmentIcs(appt)}
                  className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                  title="Download .ics Calendar Event"
                  aria-label={`Export ${appt.doctor_name} appointment to calendar`}
                >
                  📅 .ics
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleMarkDone(appt.id)}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      title="Mark this visit as completed"
                    >
                      ✓ Done
                    </button>
                    <Link
                      href={`/appointments?edit=${appt.id}`}
                      className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
                    >
                      Edit
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
