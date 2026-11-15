// Modal for editing an existing medication prescription schedule
'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Medication } from '@/lib/types';

interface MedicationEditModalProps {
  isOpen: boolean;
  medication: Medication | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Medication>) => Promise<void>;
}

export default function MedicationEditModal({
  isOpen,
  medication,
  onClose,
  onSave,
}: MedicationEditModalProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [totalStock, setTotalStock] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medication) {
      setName(medication.name || '');
      setDosage(medication.dosage || '');
      setTime(medication.time || '08:00');
      setTotalStock(medication.total_stock ?? 30);
      setLowStockThreshold(medication.low_stock_threshold ?? 5);
      setInstructions(medication.instructions || '');
      setError(null);
    }
  }, [medication]);

  if (!isOpen || !medication) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !dosage.trim() || !time) {
      setError('Please provide a medication name, dosage, and scheduled time.');
      return;
    }

    setLoading(true);
    try {
      await onSave(medication.id, {
        name: name.trim(),
        dosage: dosage.trim(),
        time,
        total_stock: Number(totalStock) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 1,
        instructions: instructions.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update prescription schedule';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-med-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-2xl font-bold p-1"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 id="edit-med-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
          Edit Medication Schedule
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Update dosage, daily reminder time, or record a refill.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Medication Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 10mg"
              required
            />
            <Input
              label="Scheduled Daily Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Current Stock (Pills Left)"
              type="number"
              value={totalStock.toString()}
              onChange={(e) => setTotalStock(parseInt(e.target.value, 10) || 0)}
              min="0"
              required
            />
            <Input
              label="Low-Stock Alert Level"
              type="number"
              value={lowStockThreshold.toString()}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 1)}
              min="1"
              required
            />
          </div>

          <Input
            label="Instructions / Notes (Optional)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Take with food or warm water"
          />

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={onClose} className="w-1/2">
              Cancel
            </Button>
            <Button type="submit" className="w-1/2 font-bold" disabled={loading}>
              {loading ? 'Saving...' : 'Save Updates'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
