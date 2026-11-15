// Appointment card component with calendar export and action triggers
import React from 'react';
import Card from '@/components/Card';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { format } from 'date-fns';
import { downloadAppointmentIcs } from '@/lib/calendar/ics';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: AppointmentStatus) => void;
  onEdit: (appt: Appointment) => void;
}

export default function AppointmentCard({
  appointment: appt,
  onStatusUpdate,
  onEdit,
}: AppointmentCardProps) {
  const dateObj = new Date(appt.datetime);

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
    <Card className="hover:shadow-md transition-shadow">
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
              onClick={() => onStatusUpdate(appt.id, 'done')}
              className="text-xs bg-green-50 text-green-700 hover:bg-green-100 font-semibold px-3 py-1.5 rounded-lg border border-green-200"
            >
              ✓ Mark Completed
            </button>
          )}
          {appt.status === 'upcoming' && (
            <button
              onClick={() => onStatusUpdate(appt.id, 'cancelled')}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadAppointmentIcs(appt)}
            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
            title="Download .ics Calendar Event"
            aria-label={`Export ${appt.doctor_name} appointment to calendar`}
          >
            📅 Export .ics
          </button>
          <button
            onClick={() => onEdit(appt)}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium underline"
          >
            Edit Details
          </button>
        </div>
      </div>
    </Card>
  );
}
