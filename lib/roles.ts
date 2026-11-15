/**
 * Unified Role Mapping and Persona Utilities for CareConnect
 * Single source of truth for UI Personas, Database Roles, and Circle Roles.
 */

import { UserRole, CircleRole } from './types';

export type UserPersona = 'elder' | 'caregiver' | 'family';

export interface PersonaConfig {
  persona: UserPersona;
  dbRole: UserRole;
  defaultCircleRole: CircleRole;
  targetRoute: string;
  badgeLabel: string;
  description: string;
}

export const PERSONA_CONFIGS: Record<UserPersona, PersonaConfig> = {
  elder: {
    persona: 'elder',
    dbRole: 'elderly_user',
    defaultCircleRole: 'owner',
    targetRoute: '/dashboard',
    badgeLabel: 'Elder',
    description: 'Manage my own medications, doctor appointments, and daily check-ins.',
  },
  caregiver: {
    persona: 'caregiver',
    dbRole: 'caregiver',
    defaultCircleRole: 'clinician',
    targetRoute: '/caregiver',
    badgeLabel: 'Clinician',
    description: 'Doctor, nurse, or professional aide overseeing clinical care.',
  },
  family: {
    persona: 'family',
    dbRole: 'caregiver',
    defaultCircleRole: 'editor',
    targetRoute: '/caregiver',
    badgeLabel: 'Family Member',
    description: 'Son, daughter, or spouse joining via passcode to stay informed.',
  },
};

/**
 * Maps any UI persona to the valid database column value ('elderly_user' | 'caregiver')
 */
export function mapPersonaToDbRole(persona: UserPersona | string): UserRole {
  if (persona === 'elder' || persona === 'elderly_user' || persona === 'senior' || persona === 'owner') {
    return 'elderly_user';
  }
  return 'caregiver';
}

/**
 * Determines target destination URL based on role metadata or explicit redirect
 */
export function getPostAuthRedirect(
  role?: string | null,
  redirectParam?: string | null
): string {
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam;
  }
  if (role === 'elderly_user' || role === 'elder') {
    return '/dashboard';
  }
  return '/caregiver';
}

/**
 * Returns clean persona display label
 */
export function getPersonaBadgeLabel(
  role?: string | null,
  metadata?: { full_name?: string | null; email?: string | null; persona?: string | null }
): string {
  if (metadata?.persona === 'family') return 'Family Member';
  if (metadata?.persona === 'caregiver' || metadata?.persona === 'clinician') return 'Clinician';

  const name = (metadata?.full_name || '').toLowerCase();
  const email = (metadata?.email || '').toLowerCase();
  if (name.startsWith('dr.') || name.includes(', md') || email.includes('dr.patel') || email.includes('doctor')) {
    return 'Clinician';
  }

  if (role === 'elderly_user' || role === 'elder' || role === 'owner') {
    return 'Elder';
  }
  if (role === 'editor') {
    return 'Family Editor';
  }
  return 'Family Member';
}
