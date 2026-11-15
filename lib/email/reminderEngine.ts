// Reminder engine: dose reminders, missed dose alerts (+15m, +60m escalation), appointment reminders (24h, 2h)
import { SupabaseClient } from '@supabase/supabase-js';
import { format, subDays, differenceInMinutes, parseISO } from 'date-fns';
import { sendEmail } from './service';
import {
  getUpcomingDoseEmail,
  getMissedDoseAlertEmail,
  getAppointmentReminderEmail,
} from './templates';

export interface ReminderRunReport {
  upcomingDoseSent: number;
  missedDoseLevel1Sent: number;
  missedDoseLevel2Sent: number;
  appointment24hSent: number;
  appointment2hSent: number;
  errors: string[];
}

/**
 * Generate a deterministic idempotency key for notification deduplication
 */
export function buildIdempotencyKey(
  type: 'upcoming_dose' | 'missed_dose_15m' | 'missed_dose_60m' | 'appointment_24h' | 'appointment_2h' | 'weekly_digest',
  entityId: string,
  dateOrWindow: string,
  recipientEmail: string
): string {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  return `${type}:${entityId}:${dateOrWindow}:${cleanEmail}`;
}

/**
 * Check if a notification has already been sent using the idempotency key
 */
export async function isNotificationAlreadySent(
  supabase: SupabaseClient,
  idempotencyKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('notification_log')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Record a sent notification in notification_log
 */
export async function logNotificationSent(
  supabase: SupabaseClient,
  params: {
    circleId?: string | null;
    recipientEmail: string;
    type: string;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  await supabase.from('notification_log').insert({
    circle_id: params.circleId || null,
    recipient_email: params.recipientEmail.trim().toLowerCase(),
    type: params.type,
    status: 'sent',
    idempotency_key: params.idempotencyKey,
    payload: params.payload || {},
  });
}

/**
 * Process upcoming dose reminders (e.g. 15-30 minutes ahead)
 */
export async function processUpcomingDoseReminders(
  supabase: SupabaseClient,
  now: Date = new Date(),
  leadTimeMinutes: number = 20
): Promise<{ sent: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];

  const todayStr = format(now, 'yyyy-MM-dd');
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();
  const targetTotalMins = currentTotalMins + leadTimeMinutes;

  // Format target time as HH:mm
  const targetHour = Math.floor(targetTotalMins / 60) % 24;
  const targetMin = targetTotalMins % 60;
  const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;

  try {
    // 1. Fetch active medications matching target time
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select(`
        id,
        user_id,
        name,
        dosage,
        time,
        is_active,
        user:users!medications_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('is_active', true)
      .eq('time', targetTimeStr);

    if (medError || !medications) {
      if (medError) errors.push(medError.message);
      return { sent, errors };
    }

    for (const med of medications) {
      const elder = med.user as any;
      if (!elder?.email) continue;

      const idempotencyKey = buildIdempotencyKey(
        'upcoming_dose',
        med.id,
        `${todayStr}:${med.time}`,
        elder.email
      );

      const alreadySent = await isNotificationAlreadySent(supabase, idempotencyKey);
      if (alreadySent) continue;

      const emailContent = getUpcomingDoseEmail({
        elderName: elder.full_name || 'there',
        medicationName: med.name,
        dosage: med.dosage,
        scheduledTime: med.time,
        leadTimeMins: leadTimeMinutes,
      });

      const res = await sendEmail({
        to: elder.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      if (res.success) {
        sent++;
        await logNotificationSent(supabase, {
          recipientEmail: elder.email,
          type: 'upcoming_dose',
          idempotencyKey,
          payload: { medicationId: med.id, time: med.time },
        });
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Unknown error in upcoming dose reminders');
  }

  return { sent, errors };
}

/**
 * Process missed dose alerts with 2-stage escalation:
 * Stage 1: +15 minutes overdue (alerts elder & opt-in circle members)
 * Stage 2: +60 minutes overdue (escalates urgency to elder & all circle editors/viewers)
 */
export async function processMissedDoseEscalations(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<{ stage1Sent: number; stage2Sent: number; errors: string[] }> {
  let stage1Sent = 0;
  let stage2Sent = 0;
  const errors: string[] = [];

  const todayStr = format(now, 'yyyy-MM-dd');
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();

  try {
    // 1. Fetch all active medications
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select(`
        id,
        user_id,
        name,
        dosage,
        time,
        user:users!medications_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('is_active', true);

    if (medError || !medications) {
      if (medError) errors.push(medError.message);
      return { stage1Sent, stage2Sent, errors };
    }

    // 2. Fetch today's logs for these medications
    const { data: logs } = await supabase
      .from('medication_logs')
      .select('medication_id, status, scheduled_time')
      .gte('scheduled_time', `${todayStr}T00:00:00.000Z`)
      .lte('scheduled_time', `${todayStr}T23:59:59.999Z`);

    const takenMedicationIds = new Set<string>();
    logs?.forEach((log) => {
      if (log.status === 'taken') {
        takenMedicationIds.add(log.medication_id);
      }
    });

    for (const med of medications) {
      // If already taken, skip
      if (takenMedicationIds.has(med.id)) continue;

      const [medHours, medMins] = med.time.split(':').map(Number);
      const medTotalMins = medHours * 60 + medMins;
      const minutesOverdue = currentTotalMins - medTotalMins;

      // Only check overdue doses that were scheduled earlier today
      if (minutesOverdue < 15) continue;

      const elder = med.user as any;
      if (!elder?.email) continue;

      // Find care circle and approved members
      const { data: circle } = await supabase
        .from('care_circles')
        .select(`
          id,
          members:circle_members(
            user_id,
            role,
            status,
            notification_preferences,
            user:users!circle_members_user_id_fkey(email, full_name)
          )
        `)
        .eq('elder_id', med.user_id)
        .maybeSingle();

      const circleMembers = (circle?.members || []) as any[];

      // LEVEL 1: Overdue by >= 15 min and < 60 min
      if (minutesOverdue >= 15 && minutesOverdue < 60) {
        // Send to elder
        const elderKey = buildIdempotencyKey('missed_dose_15m', med.id, todayStr, elder.email);
        const alreadySentElder = await isNotificationAlreadySent(supabase, elderKey);

        if (!alreadySentElder) {
          const emailData = getMissedDoseAlertEmail({
            elderName: elder.full_name || 'Elder',
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: med.time,
            minutesOverdue,
            escalationLevel: 1,
            recipientRole: 'elder',
          });

          const res = await sendEmail({
            to: elder.email,
            subject: emailData.subject,
            html: emailData.html,
          });

          if (res.success) {
            stage1Sent++;
            await logNotificationSent(supabase, {
              circleId: circle?.id,
              recipientEmail: elder.email,
              type: 'missed_dose_15m',
              idempotencyKey: elderKey,
              payload: { medicationId: med.id, minutesOverdue },
            });
          }
        }

        // Send to caretakers who have missed_doses enabled
        for (const member of circleMembers) {
          if (member.status !== 'approved') continue;
          const memberEmail = member.user?.email;
          if (!memberEmail || memberEmail === elder.email) continue;

          const prefs = member.notification_preferences || {};
          if (prefs.missed_doses === false) continue;

          const memberKey = buildIdempotencyKey('missed_dose_15m', med.id, todayStr, memberEmail);
          const alreadySent = await isNotificationAlreadySent(supabase, memberKey);
          if (alreadySent) continue;

          const emailData = getMissedDoseAlertEmail({
            elderName: elder.full_name || 'your loved one',
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: med.time,
            minutesOverdue,
            escalationLevel: 1,
            recipientRole: 'caretaker',
          });

          const res = await sendEmail({
            to: memberEmail,
            subject: emailData.subject,
            html: emailData.html,
          });

          if (res.success) {
            stage1Sent++;
            await logNotificationSent(supabase, {
              circleId: circle?.id,
              recipientEmail: memberEmail,
              type: 'missed_dose_15m',
              idempotencyKey: memberKey,
              payload: { medicationId: med.id, minutesOverdue },
            });
          }
        }
      }

      // LEVEL 2 ESCALATION: Overdue by >= 60 minutes
      if (minutesOverdue >= 60) {
        // Send urgent escalation to elder
        const elderKey2 = buildIdempotencyKey('missed_dose_60m', med.id, todayStr, elder.email);
        const alreadySentElder2 = await isNotificationAlreadySent(supabase, elderKey2);

        if (!alreadySentElder2) {
          const emailData = getMissedDoseAlertEmail({
            elderName: elder.full_name || 'Elder',
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: med.time,
            minutesOverdue,
            escalationLevel: 2,
            recipientRole: 'elder',
          });

          const res = await sendEmail({
            to: elder.email,
            subject: emailData.subject,
            html: emailData.html,
          });

          if (res.success) {
            stage2Sent++;
            await logNotificationSent(supabase, {
              circleId: circle?.id,
              recipientEmail: elder.email,
              type: 'missed_dose_60m',
              idempotencyKey: elderKey2,
              payload: { medicationId: med.id, minutesOverdue, escalation: true },
            });
          }
        }

        // Send escalation to ALL approved circle members (editors and viewers)
        for (const member of circleMembers) {
          if (member.status !== 'approved') continue;
          const memberEmail = member.user?.email;
          if (!memberEmail || memberEmail === elder.email) continue;

          const memberKey2 = buildIdempotencyKey('missed_dose_60m', med.id, todayStr, memberEmail);
          const alreadySent = await isNotificationAlreadySent(supabase, memberKey2);
          if (alreadySent) continue;

          const emailData = getMissedDoseAlertEmail({
            elderName: elder.full_name || 'your loved one',
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: med.time,
            minutesOverdue,
            escalationLevel: 2,
            recipientRole: 'caretaker',
          });

          const res = await sendEmail({
            to: memberEmail,
            subject: emailData.subject,
            html: emailData.html,
          });

          if (res.success) {
            stage2Sent++;
            await logNotificationSent(supabase, {
              circleId: circle?.id,
              recipientEmail: memberEmail,
              type: 'missed_dose_60m',
              idempotencyKey: memberKey2,
              payload: { medicationId: med.id, minutesOverdue, escalation: true },
            });
          }
        }
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Unknown error in missed dose escalation');
  }

  return { stage1Sent, stage2Sent, errors };
}

/**
 * Process doctor appointment reminders:
 * (a) 24 hours before (window between 23h and 25h)
 * (b) 2 hours before (window between 1.5h and 2.5h)
 */
export async function processAppointmentReminders(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<{ sent24h: number; sent2h: number; errors: string[] }> {
  let sent24h = 0;
  let sent2h = 0;
  const errors: string[] = [];

  const nowMs = now.getTime();

  try {
    // Fetch upcoming appointments
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id,
        circle_id,
        doctor_name,
        specialty,
        location,
        datetime,
        status,
        circle:care_circles(
          id,
          elder:users!care_circles_elder_id_fkey(id, email, full_name),
          members:circle_members(
            user_id,
            role,
            status,
            notification_preferences,
            user:users!circle_members_user_id_fkey(email, full_name)
          )
        )
      `)
      .eq('status', 'upcoming')
      .gt('datetime', now.toISOString());

    if (apptError || !appointments) {
      if (apptError) errors.push(apptError.message);
      return { sent24h, sent2h, errors };
    }

    for (const appt of appointments) {
      const apptMs = new Date(appt.datetime).getTime();
      const diffHours = (apptMs - nowMs) / (1000 * 60 * 60);

      const circle = appt.circle as any;
      const elder = circle?.elder;
      const members = (circle?.members || []) as any[];

      // Check 24-hour reminder window: between 23h and 25h
      const is24hWindow = diffHours >= 23 && diffHours <= 25;
      // Check 2-hour reminder window: between 1.5h and 2.5h
      const is2hWindow = diffHours >= 1.5 && diffHours <= 2.5;

      if (!is24hWindow && !is2hWindow) continue;

      const windowType = is24hWindow ? '24h' : '2h';
      const notificationType = is24hWindow ? 'appointment_24h' : 'appointment_2h';
      const formattedApptTime = format(new Date(appt.datetime), 'EEEE, MMMM d, yyyy @ h:mm a');

      // 1. Send to Elder if email exists
      if (elder?.email) {
        const elderKey = buildIdempotencyKey(notificationType, appt.id, windowType, elder.email);
        const alreadySent = await isNotificationAlreadySent(supabase, elderKey);

        if (!alreadySent) {
          const emailData = getAppointmentReminderEmail({
            elderName: elder.full_name || 'Elder',
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

/**
 * Master dispatcher that executes all automated email reminders
 */
export async function runAllReminders(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<ReminderRunReport> {
  const [upcoming, missed, appts] = await Promise.all([
    processUpcomingDoseReminders(supabase, now),
    processMissedDoseEscalations(supabase, now),
    processAppointmentReminders(supabase, now),
  ]);

  return {
    upcomingDoseSent: upcoming.sent,
    missedDoseLevel1Sent: missed.stage1Sent,
    missedDoseLevel2Sent: missed.stage2Sent,
    appointment24hSent: appts.sent24h,
    appointment2hSent: appts.sent2h,
    errors: [...upcoming.errors, ...missed.errors, ...appts.errors],
  };
}
