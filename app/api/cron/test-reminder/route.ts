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

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Only enabled in non-production environments for demonstration/testing
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test reminder trigger is disabled in production.' },
        { status: 403 }
      );
    }

    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json().catch(() => ({}));
    const validated = triggerTestReminderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid test reminder input' },
        { status: 400 }
      );
    }

    const { type, target_email } = validated.data;
    const recipientEmail = target_email || user.email;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
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
