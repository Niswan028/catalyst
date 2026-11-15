import { describe, it, expect } from 'vitest';
import { generateAppointmentIcs } from '@/lib/calendar/ics';
import { Appointment } from '@/lib/types';

describe('iCalendar (.ics) Export Generation', () => {
  const dummyAppointment: Appointment = {
    id: 'appt-123-uuid',
    circle_id: 'circle-123-uuid',
    doctor_name: 'Dr. Emily Watson',
    specialty: 'Neurology',
    location: 'Memorial Clinic, Suite 205',
    datetime: '2026-12-10T14:30:00Z',
    notes: 'Bring current prescription list and blood pressure logs',
    status: 'upcoming',
    created_by: 'user-1',
    created_at: '2026-11-15T10:00:00Z',
    updated_at: '2026-11-15T10:00:00Z',
  };

  it('generates standard RFC 5545 iCalendar format', () => {
    const ics = generateAppointmentIcs(dummyAppointment);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:appointment-appt-123-uuid@careconnect.app');
    expect(ics).toContain('SUMMARY:Doctor Appointment: Dr. Emily Watson (Neurology)');
    expect(ics).toContain('LOCATION:Memorial Clinic\\, Suite 205');
    expect(ics).toContain('DESCRIPTION:Bring current prescription list');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('includes 24-hour and 2-hour reminder alarms matching notification schedules', () => {
    const ics = generateAppointmentIcs(dummyAppointment);

    expect(ics).toContain('TRIGGER:-PT24H');
    expect(ics).toContain('TRIGGER:-PT2H');
    expect(ics).toContain('DESCRIPTION:Reminder: Doctor Appointment Tomorrow');
    expect(ics).toContain('DESCRIPTION:Reminder: Doctor Appointment in 2 hours');
  });
});
