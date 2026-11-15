// Reminder engine orchestrator: dose reminders, missed dose alerts (+15m, +60m escalation), appointment reminders (24h, 2h)
import { SupabaseClient } from '@supabase/supabase-js';
import { processUpcomingDoseReminders } from './schedulers/doseReminders';
import { processMissedDoseEscalations } from './schedulers/missedEscalations';
import { processAppointmentReminders } from './schedulers/appointmentReminders';

export {
  buildIdempotencyKey,
  isNotificationAlreadySent,
  logNotificationSent,
} from './idempotency';
export type { NotificationType } from './idempotency';

export { processUpcomingDoseReminders } from './schedulers/doseReminders';
export { processMissedDoseEscalations } from './schedulers/missedEscalations';
export { processAppointmentReminders } from './schedulers/appointmentReminders';

export interface ReminderRunReport {
  upcomingDoseSent: number;
  missedDoseLevel1Sent: number;
  missedDoseLevel2Sent: number;
  appointment24hSent: number;
  appointment2hSent: number;
  errors: string[];
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
