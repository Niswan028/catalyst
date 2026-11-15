import { describe, it, expect } from 'vitest';
import { buildIdempotencyKey } from '../lib/email/reminderEngine';
import {
  getUpcomingDoseEmail,
  getMissedDoseAlertEmail,
  getAppointmentReminderEmail,
  getWeeklyDigestEmail,
} from '../lib/email/templates';

describe('Reminder Idempotency Key Generation', () => {
  it('generates deterministic idempotency keys', () => {
    const key1 = buildIdempotencyKey('upcoming_dose', 'med-123', '2026-11-15:09:00', 'elder@test.com');
    const key2 = buildIdempotencyKey('upcoming_dose', 'med-123', '2026-11-15:09:00', 'elder@test.com');

    expect(key1).toBe(key2);
    expect(key1).toBe('upcoming_dose:med-123:2026-11-15:09:00:elder@test.com');
  });

  it('normalizes recipient emails to prevent duplicates from case mismatch', () => {
    const keyLower = buildIdempotencyKey('missed_dose_15m', 'med-456', '2026-11-15', 'care@test.com');
    const keyUpper = buildIdempotencyKey('missed_dose_15m', 'med-456', '2026-11-15', 'CARE@TEST.COM ');

    expect(keyLower).toBe(keyUpper);
  });

  it('produces distinct keys for stage 1 (+15m) vs stage 2 (+60m) escalations', () => {
    const stage1 = buildIdempotencyKey('missed_dose_15m', 'med-1', '2026-11-15', 'user@test.com');
    const stage2 = buildIdempotencyKey('missed_dose_60m', 'med-1', '2026-11-15', 'user@test.com');

    expect(stage1).not.toBe(stage2);
  });

  it('produces distinct keys for 24h vs 2h appointment reminders', () => {
    const appt24h = buildIdempotencyKey('appointment_24h', 'appt-99', '24h', 'user@test.com');
    const appt2h = buildIdempotencyKey('appointment_2h', 'appt-99', '2h', 'user@test.com');

    expect(appt24h).not.toBe(appt2h);
  });
});

describe('Accessible Email Templates', () => {
  it('renders upcoming dose reminder with medication and dosage details', () => {
    const email = getUpcomingDoseEmail({
      elderName: 'Margaret',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '08:00',
      leadTimeMins: 20,
    });

    expect(email.subject).toContain('Lisinopril');
    expect(email.subject).toContain('08:00');
    expect(email.html).toContain('Margaret');
    expect(email.html).toContain('10mg');
    expect(email.html).toContain('20 minutes');
  });

  it('renders missed dose alert with escalation level 1 and 2 distinctions', () => {
    const level1 = getMissedDoseAlertEmail({
      elderName: 'Robert',
      medicationName: 'Metformin',
      dosage: '500mg',
      scheduledTime: '12:00',
      minutesOverdue: 18,
      escalationLevel: 1,
      recipientRole: 'caretaker',
    });

    expect(level1.subject).toContain('Missed Dose Alert');
    expect(level1.html).toContain('~18 minutes');

    const level2 = getMissedDoseAlertEmail({
      elderName: 'Robert',
      medicationName: 'Metformin',
      dosage: '500mg',
      scheduledTime: '12:00',
      minutesOverdue: 65,
      escalationLevel: 2,
      recipientRole: 'caretaker',
    });

    expect(level2.subject).toContain('URGENT ESCALATION');
    expect(level2.subject).toContain('+60m');
    expect(level2.html).toContain('URGENT ESCALATION');
  });

  it('renders appointment reminder with doctor and location', () => {
    const email = getAppointmentReminderEmail({
      elderName: 'Arthur',
      doctorName: 'Dr. Evans',
      specialty: 'Cardiologist',
      location: 'Mercy Heart Center Room 302',
      appointmentTime: 'Tomorrow at 10:30 AM',
      windowType: '24h',
      recipientRole: 'elder',
    });

    expect(email.subject).toContain('Dr. Evans');
    expect(email.html).toContain('Cardiologist');
    expect(email.html).toContain('Mercy Heart Center Room 302');
  });

  it('renders weekly family digest with adherence percentages', () => {
    const digest = getWeeklyDigestEmail({
      elderName: 'Eleanor',
      adherenceRate: 92,
      totalTaken: 23,
      totalMissed: 2,
      streakDays: 6,
      upcomingAppointmentsCount: 1,
    });

    expect(digest.subject).toContain('92% adherence');
    expect(digest.html).toContain('Eleanor');
    expect(digest.html).toContain('6');
    expect(digest.html).toContain('rule-based');
  });
});
