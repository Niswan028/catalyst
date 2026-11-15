/**
 * Elder privacy controls and permission verification.
 * Evaluates circle memberships and granular visibility toggles per resource.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CircleRole } from './types';

export type PrivacyResourceType =
  | 'medications'
  | 'appointments'
  | 'health_checkins'
  | 'voice_messages'
  | 'insights';

export interface PermissionCheckResult {
  allowed: boolean;
  role?: CircleRole;
  reason?: string;
}

interface CircleMemberRecord {
  id: string;
  user_id: string;
  role: CircleRole;
  status: string;
  permissions?: Record<string, boolean>;
}

/**
 * Verify whether a requester can access a specific resource of an elder.
 *
 * @param supabase - Authenticated Supabase client
 * @param requesterId - UUID of the requesting user
 * @param elderId - UUID of the elder patient
 * @param resource - Specific resource category being accessed
 * @returns Permission check verdict and active role
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
    const membersList = circle.members as CircleMemberRecord[];
    const member = membersList.find(
      (m) => m.user_id === requesterId && (m.status === 'approved' || m.status === 'active')
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
