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

/**
 * Check if the user is a clinician based on profile or metadata
 */
export function isClinicianUser(
  user?: { email?: string | null; full_name?: string | null; role?: string | null; persona?: string | null } | null
): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  const fullName = user.full_name?.toLowerCase() || '';
  const role = user.role?.toLowerCase() || '';
  const persona = (user as any).persona?.toLowerCase() || '';
  return (
    email.includes('dr.patel') ||
    email.includes('doctor') ||
    email.includes('clinician') ||
    fullName.startsWith('dr.') ||
    fullName.includes(', md') ||
    role === 'clinician' ||
    persona === 'clinician'
  );
}

/**
 * Check if the user is a family member/editor based on profile or metadata
 */
export function isFamilyUser(
  user?: { email?: string | null; full_name?: string | null; role?: string | null; persona?: string | null } | null
): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  const fullName = user.full_name?.toLowerCase() || '';
  const role = user.role?.toLowerCase() || '';
  const persona = (user as any).persona?.toLowerCase() || '';
  return (
    email.includes('marcus') ||
    email.includes('family') ||
    fullName.includes('marcus') ||
    fullName.includes('family') ||
    role === 'editor' ||
    role === 'family' ||
    role === 'viewer' ||
    persona === 'family'
  );
}

/**
 * Determine if role is an elder/owner
 */
export function isElder(role?: string | null): boolean {
  return role === 'elder' || role === 'owner' || role === 'elderly_user';
}

/**
 * Elder/Owner only can manage members, generate passcodes, approve/revoke
 */
export function canManageMembers(role?: string | null): boolean {
  return role === 'owner' || role === 'elder';
}

/**
 * Elder and Family/Editor can edit medications; Clinicians and viewers are read-only
 */
export function canEditMedications(role?: string | null, isClinician?: boolean): boolean {
  if (isClinician) return false;
  return role === 'owner' || role === 'elder' || role === 'editor' || role === 'elderly_user';
}

/**
 * Elder and Family/Editor can add/edit appointments
 */
export function canEditAppointments(role?: string | null): boolean {
  return role === 'owner' || role === 'elder' || role === 'editor' || role === 'elderly_user';
}

/**
 * Elder/Owner only can toggle and view Easy Mode
 */
export function canAccessEasyMode(role?: string | null): boolean {
  return role === 'owner' || role === 'elder' || role === 'elderly_user';
}

/**
 * Human-readable role display name
 */
export function getRoleDisplayName(
  role?: string | null,
  isClinician?: boolean,
  isFamily?: boolean
): string {
  if (isClinician || role === 'clinician') return 'Clinician';
  if (isFamily || role === 'editor' || role === 'family') return 'Family Member';
  if (role === 'owner') return 'Elder Owner';
  if (role === 'elder' || role === 'elderly_user') return 'Elder';
  if (role === 'viewer') return 'Family Member';
  if (role === 'caregiver') return 'Caregiver';
  return 'Member';
}

