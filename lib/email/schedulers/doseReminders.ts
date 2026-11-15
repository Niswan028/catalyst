// Upcoming dose reminder scheduler
import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { sendEmail } from '../service';
import { getUpcomingDoseEmail } from '../templates';
import { buildIdempotencyKey, isNotificationAlreadySent, logNotificationSent } from '../idempotency';

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

  const targetHour = Math.floor(targetTotalMins / 60) % 24;
  const targetMin = targetTotalMins % 60;
  const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;

  try {
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
