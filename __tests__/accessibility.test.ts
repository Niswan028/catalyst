// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { getUpcomingDoseEmail, getMissedDoseAlertEmail, getAppointmentReminderEmail } from '../lib/email/templates';

describe('WCAG 2.1 AA Accessibility Audits (axe-core)', () => {
  it('passes axe audit on upcoming dose email HTML template', async () => {
    const template = getUpcomingDoseEmail({
      elderName: 'Margaret',
      medicationName: 'Aspirin',
      dosage: '81mg',
      scheduledTime: '08:00',
      leadTimeMins: 20,
    });

    const container = document.createElement('div');
    container.innerHTML = template.html;
    document.body.appendChild(container);

    const results = await axe.run(container, {
      rules: {
        // Document-level rules like html-has-lang/document-title can be skipped on sub-fragments
        'html-has-lang': { enabled: false },
        'document-title': { enabled: false },
      },
    });

    document.body.removeChild(container);
    expect(results.violations).toEqual([]);
  });

  it('passes axe audit on missed dose escalation alert template', async () => {
    const template = getMissedDoseAlertEmail({
      elderName: 'Robert',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '12:00',
      minutesOverdue: 60,
      escalationLevel: 2,
      recipientRole: 'caretaker',
    });

    const container = document.createElement('div');
    container.innerHTML = template.html;
    document.body.appendChild(container);

    const results = await axe.run(container, {
      rules: {
        'html-has-lang': { enabled: false },
        'document-title': { enabled: false },
      },
    });

    document.body.removeChild(container);
    expect(results.violations).toEqual([]);
  });

  it('passes axe audit on appointment reminder template', async () => {
    const template = getAppointmentReminderEmail({
      elderName: 'Arthur',
      doctorName: 'Dr. Evans',
      specialty: 'Cardiology',
      location: '123 Medical Plaza',
      appointmentTime: 'Tomorrow at 10:00 AM',
      windowType: '24h',
      recipientRole: 'elder',
    });

    const container = document.createElement('div');
    container.innerHTML = template.html;
    document.body.appendChild(container);

    const results = await axe.run(container, {
      rules: {
        'html-has-lang': { enabled: false },
        'document-title': { enabled: false },
      },
    });

    document.body.removeChild(container);
    expect(results.violations).toEqual([]);
  });
});
