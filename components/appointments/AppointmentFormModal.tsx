// Modal form for creating and editing doctor appointments
import React from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Appointment, AppointmentStatus } from '@/lib/types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSave: (e: React.FormEvent) => void;
}

export default function AppointmentFormModal({
  isOpen,
  onClose,
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
  onSave,
}: AppointmentFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
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

        <form onSubmit={onSave} className="space-y-4">
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
              onClick={onClose}
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
  );
}
