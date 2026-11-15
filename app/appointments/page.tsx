'use client';

import { Suspense } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAppointmentsData } from '@/hooks/useAppointmentsData';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal';

function AppointmentsContent() {
  const {
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
  } = useAppointmentsData();

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
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onStatusUpdate={handleStatusUpdate}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AppointmentFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingAppointment={editingAppointment}
        doctorName={doctorName}
        setDoctorName={setDoctorName}
        specialty={specialty}
        setSpecialty={setSpecialty}
        location={location}
        setLocation={setLocation}
        datetime={datetime}
        setDatetime={setDatetime}
        notes={notes}
        setNotes={setNotes}
        status={status}
        setStatus={setStatus}
        formError={formError}
        formLoading={formLoading}
        onSave={handleSaveAppointment}
      />
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
