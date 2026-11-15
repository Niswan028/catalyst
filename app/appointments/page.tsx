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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6dfd3] dark:border-stone-800 pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Clinical Calendar & Specialist Consultations
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            Appointments
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5">
            Keep track of doctor consultations, clinic locations, specialist notes, and .ics calendar sync.
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary" className="py-2.5 px-5 shadow-xs font-bold shrink-0">
          + Schedule Appointment
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#e6dfd3] dark:border-stone-800 gap-2">
        {(['upcoming', 'done', 'cancelled', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors border-b-2 ${
              activeFilter === tab
                ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
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
