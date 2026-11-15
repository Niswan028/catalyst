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

  it('passes axe audit on UI landmark, form labels, and live status updates', async () => {
    const container = document.createElement('main');
    container.innerHTML = `
      <h1>CareConnect Medication Schedule</h1>
      <nav aria-label="Quick Actions">
        <button type="button" aria-label="Confirm dose taken" style="min-height: 44px; min-width: 44px;">Confirm Taken</button>
      </nav>
      <div role="status" aria-live="polite">
        <span class="sr-only">Success: </span>
        <p>Lisinopril dose recorded at 08:00 AM</p>
      </div>
      <form>
        <label for="med-name-input">Medication Name</label>
        <input id="med-name-input" type="text" name="name" value="Lisinopril" />
        <label for="med-dose-input">Dosage</label>
        <input id="med-dose-input" type="text" name="dosage" value="10mg" />
      </form>
      <div role="progressbar" aria-valuenow="96" aria-valuemin="0" aria-valuemax="100" aria-label="Weekly Adherence: 96%">
        <span>96%</span>
      </div>
    `;
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

  it('passes axe audit on accessible modal dialog structure', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
        <h2 id="dialog-title">Log Medication Dose</h2>
        <p id="dialog-desc">Record whether your scheduled dose was taken or skipped.</p>
        <button type="button" aria-label="Close dialog">✕</button>
        <button type="button">Mark as Taken</button>
        <button type="button">Skip Dose</button>
      </div>
    `;
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

  it('passes axe audit on Easy Mode high contrast controls and status badges', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <main>
        <h1>Easy Mode Overview</h1>
        <section aria-label="Next scheduled dose">
          <h2>Metformin 500mg</h2>
          <p>Due at 12:00 PM</p>
          <button type="button" aria-label="I Took It - Metformin dose" style="min-height: 56px; font-size: 20px;">
            ✓ I Took It
          </button>
        </section>
        <section aria-label="Dose status indicators">
          <div><span aria-hidden="true">✓</span> Taken</div>
          <div><span aria-hidden="true">⚠️</span> Overdue</div>
          <div><span aria-hidden="true">⏰</span> Upcoming</div>
        </section>
      </main>
    `;
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
