// Custom hook for managing appointments data and operations
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Appointment, AppointmentStatus, User } from '@/lib/types';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

export interface UseAppointmentsDataResult {
  user: User | null;
  appointments: Appointment[];
  loading: boolean;
  activeFilter: AppointmentStatus | 'all';
  setActiveFilter: (filter: AppointmentStatus | 'all') => void;
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  editingAppointment: Appointment | null;
  doctorName: string;
  setDoctorName: (val: string) => void;
  specialty: string;
  setSpecialty: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  datetime: string;
  setDatetime: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  status: AppointmentStatus;
  setStatus: (status: AppointmentStatus) => void;
  formError: string | null;
  formLoading: boolean;
  openCreateModal: () => void;
  openEditModal: (appt: Appointment) => void;
  handleSaveAppointment: (e: React.FormEvent) => Promise<void>;
  handleStatusUpdate: (id: string, newStatus: AppointmentStatus) => Promise<void>;
}

const DEMO_ELEANOR_APPOINTMENTS: Appointment[] = [
  {
    id: 'demo-apt-1',
    circle_id: 'c1111111-1111-4111-a111-111111111111',
    doctor_name: 'Dr. Anita Patel, MD',
    specialty: 'Geriatric Specialist',
    location: 'Community Health Center · Suite 204',
    datetime: '2026-11-18T10:30:00.000Z',
    status: 'upcoming',
    notes: 'Routine blood pressure review and medication assessment.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-apt-2',
    circle_id: 'c1111111-1111-4111-a111-111111111111',
    doctor_name: 'Dr. Meera Shah',
    specialty: 'Cardiology Specialist',
    location: 'St. Jude Medical Clinic · Room 12B',
    datetime: '2026-11-25T14:00:00.000Z',
    status: 'upcoming',
    notes: 'Cardiology follow-up after Lisinopril titration.',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export function useAppointmentsData(): UseAppointmentsDataResult {
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
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const isDemoEleanor =
        session.user.email?.includes('eleanor') ||
        session.user.id === '8ce76e37-7e02-4036-9cfb-b5d37520c279';

      if (isDemoEleanor) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'eleanor.vance.demo@gmail.com',
          full_name: 'Eleanor Vance',
          role: 'elderly_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setAppointments(DEMO_ELEANOR_APPOINTMENTS);
        setLoading(false);
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 4000);

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (userData) setUser(userData);

      const url =
        activeFilter === 'all'
          ? '/api/appointments?status=all'
          : `/api/appointments?status=${activeFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok && data.appointments && data.appointments.length > 0) {
        setAppointments(data.appointments);
      } else if (isDemoEleanor) {
        setAppointments(DEMO_ELEANOR_APPOINTMENTS);
      }
    } catch (err) {
      logger.error('Failed to fetch appointments', { error: err });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [activeFilter, router]);

  useEffect(() => {
    fetchUserAndAppointments();
  }, [fetchUserAndAppointments]);

  const openCreateModal = useCallback(() => {
    setEditingAppointment(null);
    setDoctorName('');
    setSpecialty('');
    setLocation('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setDatetime(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
    setNotes('');
    setStatus('upcoming');
    setFormError(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams, openCreateModal]);

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
      const { data: { session } } = await supabase.auth.getSession();
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
      logger.error('Save appointment error', { error: err });
      setFormError('An unexpected network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      logger.error('Status update error', { error: err });
    }
  };

  return {
    user,
    appointments,
    loading,
    activeFilter,
    setActiveFilter,
    showModal,
    setShowModal,
    editingAppointment,
    doctorName,
    setDoctorName,
    specialty,
    setSpecialty,
    location,
    setLocation,
    datetime,
    setDatetime,
    notes,
    setNotes,
    status,
    setStatus,
    formError,
    formLoading,
    openCreateModal,
    openEditModal,
    handleSaveAppointment,
    handleStatusUpdate,
  };
}
