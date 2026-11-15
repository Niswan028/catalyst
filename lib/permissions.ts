// Elder privacy controls and permission verification
import { SupabaseClient } from '@supabase/supabase-js';

export type PrivacyResourceType = 'medications' | 'appointments' | 'health_checkins' | 'voice_messages';

export interface PermissionCheckResult {
  allowed: boolean;
  role?: 'elder' | 'editor' | 'viewer';
  reason?: string;
}

/**
 * Verify whether a requester can access a specific resource of an elder
 */
export async function checkElderPrivacyPermission(
  supabase: SupabaseClient,
  requesterId: string,
  elderId: string,
  resource: PrivacyResourceType
): Promise<PermissionCheckResult> {
  // If requester is the elder themselves, always allowed
  if (requesterId === elderId) {
    return { allowed: true, role: 'elder' };
  }

  // 1. Check Care Circles and Circle Memberships
  const { data: circle } = await supabase
    .from('care_circles')
    .select(`
      id,
      elder_id,
      members:circle_members(
        id,
        user_id,
        role,
        status,
        permissions
      )
    `)
    .eq('elder_id', elderId)
    .maybeSingle();

  if (circle?.members) {
    const member = circle.members.find(
      (m: any) => m.user_id === requesterId && m.status === 'approved'
    );

    if (member) {
      const perms = member.permissions || {};
      const hasPermission = perms[resource] !== false; // defaults to true unless explicitly disabled

      if (!hasPermission) {
        return {
          allowed: false,
          role: member.role,
          reason: `The elder has restricted access to their ${resource.replace('_', ' ')}.`,
        };
      }

      return {
        allowed: true,
        role: member.role,
      };
    }
  }

  // 2. Fallback to legacy caregiver_links (if table exists)
  const { data: legacyLink } = await supabase
    .from('caregiver_links')
    .select('id')
    .eq('caregiver_id', requesterId)
    .eq('elderly_user_id', elderId)
    .maybeSingle();

  if (legacyLink) {
    return { allowed: true, role: 'viewer' };
  }

  return {
    allowed: false,
    reason: 'You are not an approved member of this elder’s Family Care Circle.',
  };
}
