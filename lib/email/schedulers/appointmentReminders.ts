// Doctor appointment reminder scheduler (24h and 2h proactive alerts)
import { SupabaseClient } from '@supabase/supabase-js';
import { differenceInMinutes, parseISO } from 'date-fns';
import { sendEmail } from '../service';
import { getAppointmentReminderEmail } from '../templates';
import { buildIdempotencyKey, isNotificationAlreadySent, logNotificationSent } from '../idempotency';

export async function processAppointmentReminders(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<{ sent24h: number; sent2h: number; errors: string[] }> {
  let sent24h = 0;
  let sent2h = 0;
  const errors: string[] = [];

  try {
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id,
        user_id,
        circle_id,
        doctor_name,
        specialty,
        location,
        datetime,
        status,
        user:users!appointments_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('status', 'upcoming');

    if (apptError || !appointments) {
      if (apptError) errors.push(apptError.message);
      return { sent24h, sent2h, errors };
    }

    for (const appt of appointments) {
      const apptDate = parseISO(appt.datetime);
      const diffMins = differenceInMinutes(apptDate, now);

      const is24hWindow = diffMins >= 1410 && diffMins <= 1470; // 24 hours ± 30 mins
      const is2hWindow = diffMins >= 105 && diffMins <= 135;   // 2 hours ± 15 mins

      if (!is24hWindow && !is2hWindow) continue;

      const windowType = is24hWindow ? '24h' : '2h';
      const notificationType = is24hWindow ? 'appointment_24h' : 'appointment_2h';
      const formattedApptTime = apptDate.toLocaleString(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const elder = appt.user as any;

      let members: any[] = [];
      if (appt.circle_id) {
        const { data: circleData } = await supabase
          .from('care_circles')
          .select(`
            members:circle_members(
              user_id,
              status,
              notification_preferences,
              user:users!circle_members_user_id_fkey(email, full_name)
            )
          `)
          .eq('id', appt.circle_id)
          .maybeSingle();

        members = (circleData?.members || []) as any[];
      }

      // 1. Send to elder
      if (elder?.email) {
        const elderKey = buildIdempotencyKey(notificationType, appt.id, windowType, elder.email);
        const alreadySent = await isNotificationAlreadySent(supabase, elderKey);

        if (!alreadySent) {
          const emailData = getAppointmentReminderEmail({
            elderName: elder.full_name || 'there',
            doctorName: appt.doctor_name,
            specialty: appt.specialty,
            location: appt.location,
            appointmentTime: formattedApptTime,
            windowType,
            recipientRole: 'elder',
          });

          const res = await sendEmail({
            to: elder.email,
            subject: emailData.subject,
            html: emailData.html,
          });

          if (res.success) {
            if (is24hWindow) sent24h++;
            else sent2h++;

            await logNotificationSent(supabase, {
              circleId: appt.circle_id,
              recipientEmail: elder.email,
              type: notificationType,
              idempotencyKey: elderKey,
              payload: { appointmentId: appt.id, windowType },
            });
          }
        }
      }

      // 2. Send to circle members with appointments enabled
      for (const member of members) {
        if (member.status !== 'approved') continue;
        const memberEmail = member.user?.email;
        if (!memberEmail || memberEmail === elder?.email) continue;

        const prefs = member.notification_preferences || {};
        if (prefs.appointments === false) continue;

        const memberKey = buildIdempotencyKey(notificationType, appt.id, windowType, memberEmail);
        const alreadySent = await isNotificationAlreadySent(supabase, memberKey);
        if (alreadySent) continue;

        const emailData = getAppointmentReminderEmail({
          elderName: elder?.full_name || 'your family member',
          doctorName: appt.doctor_name,
          specialty: appt.specialty,
          location: appt.location,
          appointmentTime: formattedApptTime,
          windowType,
          recipientRole: 'caretaker',
        });

        const res = await sendEmail({
          to: memberEmail,
          subject: emailData.subject,
          html: emailData.html,
        });

        if (res.success) {
          if (is24hWindow) sent24h++;
          else sent2h++;

          await logNotificationSent(supabase, {
            circleId: appt.circle_id,
            recipientEmail: memberEmail,
            type: notificationType,
            idempotencyKey: memberKey,
            payload: { appointmentId: appt.id, windowType },
          });
        }
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Unknown error in appointment reminders');
  }

  return { sent24h, sent2h, errors };
}
