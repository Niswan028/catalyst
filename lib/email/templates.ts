// Accessible, responsive HTML email templates for CareConnect

export function baseEmailLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      color: #1f2937;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 600px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #2563eb;
      color: #ffffff;
      padding: 24px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
      font-size: 16px;
    }
    .card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .alert-card {
      background-color: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 28px;
      border-radius: 10px;
      margin-top: 16px;
      text-align: center;
    }
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 20px 32px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>CareConnect</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>CareConnect • Elderly Care & Medication Management Platform</p>
      <p>This is an automated notification. To update your reminder preferences, visit your CareConnect Family Circle settings.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getUpcomingDoseEmail(params: {
  elderName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  leadTimeMins: number;
}) {
  const content = `
    <h2 style="color: #1e3a8a; font-size: 20px; margin-top: 0;">⏰ Upcoming Medication Reminder</h2>
    <p>Hello <strong>${params.elderName}</strong>,</p>
    <p>This is a friendly reminder that you have a scheduled medication coming up in approximately <strong>${params.leadTimeMins} minutes</strong>.</p>
    
    <div class="card">
      <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">💊 ${params.medicationName}</h3>
      <p style="margin: 4px 0;"><strong>Dosage:</strong> ${params.dosage}</p>
      <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${params.scheduledTime}</p>
    </div>

    <p>Please remember to take your dose with water as prescribed by your doctor. When taken, you can log it with one click on your CareConnect dashboard.</p>
  `;

  return {
    subject: `Reminder: ${params.medicationName} dose scheduled for ${params.scheduledTime}`,
    html: baseEmailLayout('Upcoming Dose Reminder', content),
  };
}

export function getMissedDoseAlertEmail(params: {
  elderName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  minutesOverdue: number;
  escalationLevel: 1 | 2;
  recipientRole: 'elder' | 'caretaker';
}) {
  const isEscalation = params.escalationLevel === 2;
  const isCaretaker = params.recipientRole === 'caretaker';

  const badgeColor = isEscalation ? '#b91c1c' : '#c2410c';
  const badgeTitle = isEscalation
    ? '🚨 URGENT ESCALATION: Medication Overdue by 1+ Hour'
    : '⚠️ Missed Medication Notice (15 mins overdue)';

  const recipientMessage = isCaretaker
    ? `<p>You are receiving this alert as an approved member of <strong>${params.elderName}</strong>'s Family Care Circle. Their scheduled dose has not been confirmed yet.</p>`
    : `<p>Hello <strong>${params.elderName}</strong>, we noticed that you haven't confirmed taking your scheduled dose yet.</p>`;

  const content = `
    <div class="alert-card" style="border-color: ${badgeColor};">
      <h2 style="color: ${badgeColor}; font-size: 20px; margin: 0 0 10px 0;">${badgeTitle}</h2>
      ${recipientMessage}
      
      <div style="background: #ffffff; padding: 14px; border-radius: 8px; margin: 12px 0;">
        <p style="margin: 4px 0;"><strong>Medication:</strong> ${params.medicationName}</p>
        <p style="margin: 4px 0;"><strong>Prescribed Dosage:</strong> ${params.dosage}</p>
        <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${params.scheduledTime}</p>
        <p style="margin: 4px 0; color: ${badgeColor}; font-weight: bold;"><strong>Time Overdue:</strong> ~${params.minutesOverdue} minutes</p>
      </div>

      <p style="margin-bottom: 0;">
        ${
          isCaretaker
            ? `Please check in with <strong>${params.elderName}</strong> to ensure they are feeling well and have taken their prescribed medication.`
            : `If you have already taken this medication, please tap below or open the CareConnect app to mark it as taken.`
        }
      </p>
    </div>
  `;

  const subject = isEscalation
    ? `🚨 URGENT ESCALATION: ${params.elderName} missed ${params.medicationName} (+60m)`
    : `⚠️ Missed Dose Alert: ${params.medicationName} for ${params.elderName}`;

  return {
    subject,
    html: baseEmailLayout(badgeTitle, content),
  };
}

export function getAppointmentReminderEmail(params: {
  elderName: string;
  doctorName: string;
  specialty?: string | null;
  location?: string | null;
  appointmentTime: string;
  windowType: '24h' | '2h';
  recipientRole: 'elder' | 'caretaker';
}) {
  const is2h = params.windowType === '2h';
  const timeDesc = is2h ? 'in approximately 2 hours' : 'tomorrow';

  const content = `
    <h2 style="color: #1e3a8a; font-size: 20px; margin-top: 0;">
      🗓️ Doctor Appointment Reminder (${is2h ? '2 Hours Away' : 'Tomorrow'})
    </h2>
    <p>This is a reminder that <strong>${params.elderName}</strong> has a medical appointment scheduled <strong>${timeDesc}</strong>.</p>
    
    <div class="card">
      <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">👨‍⚕️ ${params.doctorName}</h3>
      ${params.specialty ? `<p style="margin: 4px 0;"><strong>Specialty:</strong> ${params.specialty}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${params.appointmentTime}</p>
      ${params.location ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${params.location}</p>` : ''}
    </div>

    <p>Please remember to bring along any prior health records, insurance cards, and your current medication list.</p>
  `;

  return {
    subject: `Appointment Reminder: ${params.doctorName} (${timeDesc})`,
    html: baseEmailLayout('Doctor Appointment Reminder', content),
  };
}

export function getWeeklyDigestEmail(params: {
  elderName: string;
  adherenceRate: number;
  totalTaken: number;
  totalMissed: number;
  streakDays: number;
  upcomingAppointmentsCount: number;
}) {
  const content = `
    <h2 style="color: #1e3a8a; font-size: 20px; margin-top: 0;">📊 Weekly Family Care Circle Digest</h2>
    <p>Here is the weekly health and medication adherence summary for <strong>${params.elderName}</strong>.</p>
    
    <div class="card">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">Weekly Performance</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div>
          <p style="margin: 0; font-size: 28px; font-weight: 800; color: ${params.adherenceRate >= 80 ? '#16a34a' : '#d97706'};">
            ${params.adherenceRate}%
          </p>
          <span style="font-size: 12px; color: #6b7280;">Adherence Rate</span>
        </div>
        <div>
          <p style="margin: 0; font-size: 28px; font-weight: 800; color: #2563eb;">
            ${params.streakDays}
          </p>
          <span style="font-size: 12px; color: #6b7280;">Day Streak</span>
        </div>
      </div>
      <p style="margin: 4px 0;"><strong>Doses Confirmed:</strong> ${params.totalTaken}</p>
      <p style="margin: 4px 0;"><strong>Doses Missed:</strong> ${params.totalMissed}</p>
      <p style="margin: 4px 0;"><strong>Upcoming Appointments:</strong> ${params.upcomingAppointmentsCount}</p>
    </div>

    <p style="font-size: 12px; color: #6b7280; font-style: italic;">
      Note: This summary is rule-based and not medical advice. Always discuss with healthcare providers before altering routines.
    </p>
  `;

  return {
    subject: `Weekly Care Digest for ${params.elderName} (${params.adherenceRate}% adherence)`,
    html: baseEmailLayout('Weekly Care Circle Digest', content),
  };
}
