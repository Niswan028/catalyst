// Missed dose 2-stage escalation scheduler (+15m alert, +60m urgent escalation)
import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { sendEmail } from '../service';
import { getMissedDoseAlertEmail } from '../templates';
import { buildIdempotencyKey, isNotificationAlreadySent, logNotificationSent } from '../idempotency';

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
      if (takenMedicationIds.has(med.id)) continue;

      const [medHours, medMins] = med.time.split(':').map(Number);
      const medTotalMins = (medHours ?? 0) * 60 + (medMins ?? 0);
      const minutesOverdue = currentTotalMins - medTotalMins;

      if (minutesOverdue < 15) continue;

      const elder = med.user as any;
      if (!elder?.email) continue;

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
