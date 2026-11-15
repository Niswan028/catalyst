import { Appointment } from '@/lib/types';
import { format, parseISO, addHours } from 'date-fns';

/**
 * Formats a Date object to iCalendar UTC timestamp string (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Clean string for iCalendar text fields
 */
function sanitizeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate RFC 5545 compliant iCalendar string for an appointment
 */
export function generateAppointmentIcs(appointment: Appointment): string {
  const startDate = parseISO(appointment.datetime);
  const endDate = addHours(startDate, 1); // default 1 hour appointment duration
  const now = new Date();

  const title = sanitizeIcsText(
    `Doctor Appointment: ${appointment.doctor_name}${
      appointment.specialty ? ` (${appointment.specialty})` : ''
    }`
  );
  const location = appointment.location ? sanitizeIcsText(appointment.location) : '';
  const description = sanitizeIcsText(
    `${appointment.notes ? appointment.notes + '\n\n' : ''}Managed securely via CareConnect Elderly Care Platform.`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareConnect//Elderly Care Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appointment-${appointment.id}@careconnect.app`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Doctor Appointment Tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Doctor Appointment in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadAppointmentIcs(appointment: Appointment): void {
  if (typeof window === 'undefined') return;

  const icsContent = generateAppointmentIcs(appointment);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `appointment-${appointment.doctor_name.replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
