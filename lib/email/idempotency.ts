// Notification idempotency and deduplication helpers
import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType =
  | 'upcoming_dose'
  | 'missed_dose_15m'
  | 'missed_dose_60m'
  | 'appointment_24h'
  | 'appointment_2h'
  | 'weekly_digest';

/**
 * Generate a deterministic idempotency key for notification deduplication
 */
export function buildIdempotencyKey(
  type: NotificationType,
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
