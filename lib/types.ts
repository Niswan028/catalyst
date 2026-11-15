/**
 * Comprehensive TypeScript definitions for CareConnect Platform.
 * Features strict discriminated unions, audit interfaces, and smart feature types.
 */

export type UserRole = 'elderly_user' | 'caregiver';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaregiverLink {
  id: string;
  caregiver_id: string;
  elderly_user_id: string;
  created_at: string;
}

export interface HealthCheckin {
  id: string;
  user_id: string;
  transcript: string;
  detected_keywords: string[];
  mood: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  time: string; // Format: "HH:MM"
  frequency?: string | null;
  instructions?: string | null;
  total_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DoseStatus = 'taken' | 'skipped' | 'missed' | 'later';

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  status: DoseStatus;
  scheduled_time: string;
  logged_at: string;
}

export interface VoiceMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  audio_url: string;
  duration_seconds: number | null;
  is_read: boolean;
  created_at: string;
  signed_url?: string;
  sender?: Pick<User, 'id' | 'email' | 'full_name'>;
  recipient?: Pick<User, 'id' | 'email' | 'full_name'>;
}

export interface StockAlert {
  id: string;
  medication_id: string;
  user_id: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
  medication?: Medication;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  mood_summary: string | null;
  symptoms: string[];
  medication_adherence_rate: number | null;
  total_checkins: number;
  created_at: string;
}

export interface MedicationWithLogs extends Medication {
  logs?: MedicationLog[];
}

export interface LinkedUser extends User {
  link_id: string;
}

// ====================================================
// FAMILY CARE CIRCLE & PERMISSIONS TYPES
// ====================================================

export type CircleRole = 'owner' | 'elder' | 'editor' | 'viewer' | 'clinician';
export type CircleMemberStatus = 'pending' | 'approved' | 'active' | 'revoked' | 'declined';

export interface CircleMemberPermissions {
  medications: boolean;
  appointments: boolean;
  health_checkins: boolean;
  voice_messages: boolean;
  insights?: boolean;
}

export interface NotificationPreferences {
  upcoming_doses: boolean;
  missed_doses: boolean;
  appointments: boolean;
  weekly_digest: boolean;
}

export interface CareCircle {
  id: string;
  elder_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  elder?: User;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: CircleRole;
  status: CircleMemberStatus;
  permissions: CircleMemberPermissions;
  notification_preferences: NotificationPreferences;
  joined_at: string;
  updated_at: string;
  user?: User;
  circle?: CareCircle;
}

export interface InviteCode {
  id: string;
  circle_id: string;
  created_by: string;
  code_hash: string;
  code_prefix: string;
  role: 'editor' | 'viewer';
  max_uses: number;
  uses_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
}

// ====================================================
// APPOINTMENTS TYPES
// ====================================================

export type AppointmentStatus = 'upcoming' | 'completed' | 'done' | 'cancelled';

export interface Appointment {
  id: string;
  circle_id: string;
  doctor_name: string;
  specialty?: string | null;
  location?: string | null;
  datetime: string; // ISO String
  notes?: string | null;
  status: AppointmentStatus;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// ====================================================
// AUDIT LOG & NOTIFICATIONS TYPES
// ====================================================

export interface AuditLogEntry {
  id: string;
  circle_id?: string | null;
  actor_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  actor?: User;
}

export interface NotificationLogEntry {
  id: string;
  circle_id?: string | null;
  recipient_email: string;
  type: string;
  status: string;
  idempotency_key: string;
  payload?: Record<string, unknown> | null;
  sent_at: string;
}

// ====================================================
// SMART FEATURES & INSIGHTS TYPES
// ====================================================

export interface AdherencePattern {
  timeSlot: string; // e.g. "14:00"
  missedCount: number;
  totalScheduled: number;
  missedPercentage: number;
  suggestion: string;
}

export interface AdherenceInsight {
  hasData: boolean;
  adherenceRateDisplay: string;
  weeklyAdherenceRate: number | null;
  monthlyAdherenceRate: number | null;
  streakDays: number;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  patterns: AdherencePattern[];
  disclaimer: string;
}

export interface RefillPrediction {
  medicationId: string;
  medicationName: string;
  currentStock: number;
  dailyDosageCount: number;
  daysRemaining: number;
  predictedRunOutDate: string; // YYYY-MM-DD
  isLowStock: boolean;
  needsUrgentRefill: boolean;
}

// ====================================================
// API RESPONSE SHAPES
// ====================================================

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
