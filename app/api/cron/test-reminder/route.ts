import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/authServer';
import { sendEmail } from '@/lib/email/service';
import {
  getUpcomingDoseEmail,
  getMissedDoseAlertEmail,
  getAppointmentReminderEmail,
  getWeeklyDigestEmail,
} from '@/lib/email/templates';
import { triggerTestReminderSchema } from '@/features/notifications/schemas';
import { checkRateLimit, recordFailedAttempt, DEMO_RATE_LIMIT_CONFIG } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    // Rate-limit test reminders per user (5 per 5 minutes)
    const rateLimitKey = `test_reminder:${user.id}`;
    const limitStatus = checkRateLimit(rateLimitKey, DEMO_RATE_LIMIT_CONFIG);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Test reminder rate limit exceeded. Please wait ${Math.ceil(
            limitStatus.retryAfterSeconds / 60
          )} minutes before triggering another test email.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = triggerTestReminderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid test reminder input' },
        { status: 400 }
      );
    }

    const { type } = validated.data;
    // Security constraint: Send test emails ONLY to the authenticated demo user's own email
    const recipientEmail = user.email;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Authenticated user email is required' }, { status: 400 });
    }

    let emailData: { subject: string; html: string; text?: string };

    switch (type) {
      case 'upcoming_dose':
        emailData = getUpcomingDoseEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          medicationName: 'Lisinopril',
          dosage: '10mg',
          scheduledTime: '09:00',
          leadTimeMins: 15,
        });
        break;

      case 'missed_dose_15m':
        emailData = getMissedDoseAlertEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          medicationName: 'Metformin',
          dosage: '500mg',
          scheduledTime: '08:30',
          minutesOverdue: 15,
          escalationLevel: 1,
          recipientRole: 'caretaker',
        });
        break;

      case 'missed_dose_60m':
        emailData = getMissedDoseAlertEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          medicationName: 'Metformin',
          dosage: '500mg',
          scheduledTime: '08:30',
          minutesOverdue: 60,
          escalationLevel: 2,
          recipientRole: 'caretaker',
        });
        break;

      case 'appointment_24h':
        emailData = getAppointmentReminderEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          doctorName: 'Dr. Sarah Jenkins',
          specialty: 'Cardiology',
          location: 'City General Hospital, Suite 302',
          appointmentTime: 'Tomorrow at 10:30 AM',
          windowType: '24h',
          recipientRole: 'elder',
        });
        break;

      case 'appointment_2h':
        emailData = getAppointmentReminderEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          doctorName: 'Dr. Sarah Jenkins',
          specialty: 'Cardiology',
          location: 'City General Hospital, Suite 302',
          appointmentTime: 'Today at 10:30 AM (in 2 hours)',
          windowType: '2h',
          recipientRole: 'elder',
        });
        break;

      default:
        emailData = getWeeklyDigestEmail({
          elderName: user.user_metadata?.full_name || 'Eleanor Vance',
          adherenceRate: 94,
          totalTaken: 26,
          totalMissed: 2,
          streakDays: 7,
          upcomingAppointmentsCount: 1,
        });
        break;
    }

    const sendResult = await sendEmail({
      to: recipientEmail,
      subject: `[TEST DEMO] ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text,
    });

    return NextResponse.json({
      success: sendResult.success,
      type,
      recipientEmail,
      messageId: sendResult.messageId,
      mocked: sendResult.mocked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test reminder';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/test-reminder',
    method: 'POST',
    description: 'Trigger a test reminder email for the authenticated demo account.',
    allowedTypes: ['upcoming_dose', 'missed_dose', 'appointment', 'weekly_digest'],
    instructions: 'Send an authenticated POST request from the Demo Guide or Dashboard test trigger.',
  });
}
