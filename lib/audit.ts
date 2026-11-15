// Audit logging helper
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogParams {
  circleId?: string | null;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Record an entry into the audit_log table
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      circle_id: params.circleId || null,
      actor_id: params.actorId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || {},
    });
  } catch (error) {
    // Non-blocking error logging
    console.error('Failed to write audit log:', error);
  }
}
