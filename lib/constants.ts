/**
 * Centralized Application Constants & Configuration Tokens
 * Replaces magic values, strings, and numbers across CareConnect.
 */

// Authentication & Session Cookies
export const AUTH_CONSTANTS = {
  COOKIE_NAME: 'sb-access-token',
  COOKIE_MAX_AGE_SECONDS: 604800, // 7 days
  BCRYPT_SALT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Supabase Production Defaults (ensures zero-config connectivity on remote deployments)
export const SUPABASE_DEFAULTS = {
  URL: 'https://ngfzyzznryeoliodkvtd.supabase.co',
  ANON_KEY: 'sb_publishable_LV9Pw_b8LNXC8GdN4Ukrxg_3RjZbIG7',
} as const;

// Roles and Status Discriminated Unions
export const USER_ROLES = {
  ELDER: 'elderly_user',
  CAREGIVER: 'caregiver',
} as const;

export const CIRCLE_ROLES = {
  OWNER: 'owner',
  ELDER: 'elder',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export const CIRCLE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  REVOKED: 'revoked',
  DECLINED: 'declined',
} as const;

export const DOSE_STATUS = {
  TAKEN: 'taken',
  SKIPPED: 'skipped',
  MISSED: 'missed',
  LATER: 'later',
} as const;

export const APPOINTMENT_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

// Health-related keywords to detect in check-ins
export const HEALTH_KEYWORDS = [
  'pain',
  'tired',
  'headache',
  'dizzy',
  'fever',
  'sad',
  'anxious',
  'depressed',
  'nausea',
  'cough',
  'cold',
  'weak',
  'sick',
  'hurt',
  'ache',
  'worry',
  'upset',
  'lonely',
  'sleepy',
  'exhausted',
] as const;

// Mood detection patterns
export const MOOD_PATTERNS = {
  good: ['good', 'great', 'excellent', 'fine', 'well', 'happy', 'better', 'okay'],
  bad: ['bad', 'terrible', 'awful', 'worse', 'poor', 'sick', 'ill'],
  neutral: ['okay', 'alright', 'so-so', 'fine'],
} as const;

// Default TTS voice settings
export const TTS_CONFIG = {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
} as const;

// Notification settings
export const NOTIFICATION_CONFIG = {
  icon: '/icon-192x192.png',
  badge: '/icon-192x192.png',
  requireInteraction: true,
} as const;

// Pagination & query defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  APPOINTMENTS_LIMIT: 20,
  AUDIT_LOG_LIMIT: 50,
  SUMMARIES_LIMIT: 7,
} as const;

// Passcode and Circle Security
export const SECURITY_CONFIG = {
  PASSCODE_LENGTH: 6,
  PASSCODE_MAX_ATTEMPTS: 5,
  PASSCODE_LOCKOUT_MINUTES: 15,
  PASSCODE_LOCKOUT_WINDOW_MS: 15 * 60 * 1000,
  PASSCODE_DEFAULT_EXPIRY_HOURS: 48,
  SIGNED_AUDIO_URL_EXPIRY_SECONDS: 900, // 15 minutes
  MAX_AUDIO_UPLOAD_BYTES: 10 * 1024 * 1024, // 10MB
} as const;

// Medication Reminder and Escalation Thresholds
export const REMINDER_CONFIG = {
  FIRST_ESCALATION_MINUTES: 15,
  SECOND_ESCALATION_MINUTES: 60,
  APPOINTMENT_LEAD_HOURS_LONG: 24,
  APPOINTMENT_LEAD_HOURS_SHORT: 2,
  DEFAULT_LEAD_TIME_MINUTES: 15,
  URGENT_REFILL_DAYS_THRESHOLD: 7,
} as const;

// Navigation routes
export const APP_ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CAREGIVER: '/caregiver',
  MEDICATIONS: '/medications',
  APPOINTMENTS: '/appointments',
  CHECKIN: '/checkin',
  MESSAGES: '/messages',
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
} as const;
