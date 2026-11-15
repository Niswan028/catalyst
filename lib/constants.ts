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
];

// Mood detection patterns
export const MOOD_PATTERNS = {
  good: ['good', 'great', 'excellent', 'fine', 'well', 'happy', 'better', 'okay'],
  bad: ['bad', 'terrible', 'awful', 'worse', 'poor', 'sick', 'ill'],
  neutral: ['okay', 'alright', 'so-so', 'fine'],
};

// Default TTS voice settings
export const TTS_CONFIG = {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
};

// Notification settings
export const NOTIFICATION_CONFIG = {
  icon: '/icon-192x192.png',
  badge: '/icon-192x192.png',
  requireInteraction: true,
};

// Pagination & query defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  APPOINTMENTS_LIMIT: 20,
  AUDIT_LOG_LIMIT: 50,
  SUMMARIES_LIMIT: 7,
};

// Passcode and Circle Security
export const SECURITY_CONFIG = {
  PASSCODE_LENGTH: 6,
  PASSCODE_MAX_ATTEMPTS: 5,
  PASSCODE_LOCKOUT_MINUTES: 15,
  PASSCODE_DEFAULT_EXPIRY_HOURS: 48,
  SIGNED_AUDIO_URL_EXPIRY_SECONDS: 900, // 15 minutes
};

// Medication Reminder and Escalation Thresholds
export const REMINDER_CONFIG = {
  FIRST_ESCALATION_MINUTES: 15,
  SECOND_ESCALATION_MINUTES: 60,
  APPOINTMENT_LEAD_HOURS_LONG: 24,
  APPOINTMENT_LEAD_HOURS_SHORT: 2,
  DEFAULT_LEAD_TIME_MINUTES: 15,
  URGENT_REFILL_DAYS_THRESHOLD: 7,
};

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
};


