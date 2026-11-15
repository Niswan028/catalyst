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

const INITIAL_FORM: MedicationFormData = {
  name: '',
  dosage: '',
  time: '',
  total_stock: 0,
  low_stock_threshold: 5,
};

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<MedicationFormData>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMedications = useCallback(async () => {
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
      });
      const data = await response.json();
      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (err) {
      logger.error('Error fetching medications', { error: err });
    } finally {
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
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Medications</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Medication'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {showAddForm && (
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
            <Button onClick={() => setShowAddForm(true)}>Add Your First Medication</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
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
