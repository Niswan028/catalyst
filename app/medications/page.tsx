// Medications management page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Medication } from '@/lib/types';
import { requestNotificationPermission, showMedicationReminder } from '@/utils/notifications';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import MedicationCard from '@/components/medications/MedicationCard';
import MedicationAddForm, { MedicationFormData } from '@/components/medications/MedicationAddForm';
import MedicationEditModal from '@/components/medications/MedicationEditModal';
import { isClinicianUser, canEditMedications } from '@/lib/permissions';

const INITIAL_FORM: MedicationFormData = {
  name: '',
  dosage: '',
  time: '',
  total_stock: 0,
  low_stock_threshold: 5,
};

const DEMO_FALLBACK_MEDICATIONS: Medication[] = [
  {
    id: 'demo-med-1',
    user_id: '8ce76e37-7e02-4036-9cfb-b5d37520c279',
    name: 'Lisinopril',
    dosage: '10mg',
    time: '08:00',
    total_stock: 28,
    low_stock_threshold: 7,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-med-2',
    user_id: '8ce76e37-7e02-4036-9cfb-b5d37520c279',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    time: '09:00',
    total_stock: 60,
    low_stock_threshold: 10,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-med-3',
    user_id: '8ce76e37-7e02-4036-9cfb-b5d37520c279',
    name: 'Metformin',
    dosage: '500mg',
    time: '12:30',
    total_stock: 45,
    low_stock_threshold: 10,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-med-4',
    user_id: '8ce76e37-7e02-4036-9cfb-b5d37520c279',
    name: 'Atorvastatin',
    dosage: '20mg',
    time: '21:00',
    total_stock: 4,
    low_stock_threshold: 7,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>(DEMO_FALLBACK_MEDICATIONS);
  const [loading, setLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<MedicationFormData>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMedications = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/medications', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      });
      const data = await response.json();
      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (err) {
      logger.error('Error fetching medications', { error: err });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      const isDoctor = isClinicianUser({
        email: user.email,
        full_name: user.user_metadata?.full_name,
        role: user.user_metadata?.role,
      });
      setCanEdit(!isDoctor && canEditMedications(user.user_metadata?.role, isDoctor));
      fetchMedications();
      requestNotificationPermission();
    };
    checkAuth();
  }, [router, fetchMedications]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      medications.forEach((med) => {
        if (med.time === currentTime && med.is_active) {
          showMedicationReminder(med.name, med.dosage, med.id);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [medications]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add medication');
      }

      setSuccess('Medication added successfully!');
      setShowAddForm(false);
      setFormData(INITIAL_FORM);
      fetchMedications();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to add medication');
    }
  };

  const handleLogMedication = async (
    medicationId: string,
    status: 'taken' | 'skipped' | 'missed'
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          medication_id: medicationId,
          status,
          scheduled_time: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log medication');
      }

      setSuccess(`Medication marked as ${status}!`);
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to log medication');
    }
  };

  const handleSaveEditedMedication = async (
    medicationId: string,
    updates: Partial<Medication>
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/medications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        id: medicationId,
        ...updates,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update medication schedule');
    }

    setSuccess('Medication schedule successfully updated!');
    fetchMedications();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/medications?id=${medicationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete medication');
      }

      setSuccess('Medication deleted successfully!');
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to delete medication');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-pulse">
        <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl" />
          <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6dfd3] dark:border-stone-800 pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Schedule & Prescription Inventory
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            Prescriptions
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5">
            Manage daily schedules, stock refill thresholds, dose tracking, and caregiver alerts.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="shrink-0 font-bold">
            {showAddForm ? '✕ Close Form' : '+ Add Medication'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchMedications}
            className="text-xs font-bold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {showAddForm && canEdit && (
        <MedicationAddForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddMedication}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {medications.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💊</div>
            <p className="text-gray-600 mb-4">No medications added yet.</p>
            {canEdit && (
              <Button onClick={() => setShowAddForm(true)}>Add Your First Medication</Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              canEdit={canEdit}
              onLog={handleLogMedication}
              onEdit={(m) => setEditingMedication(m)}
              onDelete={handleDeleteMedication}
            />
          ))}
        </div>
      )}

      {/* Edit Medication Modal */}
      <MedicationEditModal
        isOpen={editingMedication !== null}
        medication={editingMedication}
        onClose={() => setEditingMedication(null)}
        onSave={handleSaveEditedMedication}
      />
    </div>
  );
}
