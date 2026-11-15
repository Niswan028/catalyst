import { z } from 'zod';

export const notificationPreferencesSchema = z.object({
  upcoming_doses: z.boolean().default(true),
  missed_doses: z.boolean().default(true),
  appointments: z.boolean().default(true),
  weekly_digest: z.boolean().default(true),
  email_enabled: z.boolean().default(true),
  lead_time_minutes: z.number().int().min(5).max(120).default(15),
});

export const triggerTestReminderSchema = z.object({
  type: z.enum(['upcoming_dose', 'missed_dose_15m', 'missed_dose_60m', 'appointment_24h', 'appointment_2h']),
  target_email: z.string().email().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type TriggerTestReminderInput = z.infer<typeof triggerTestReminderSchema>;
