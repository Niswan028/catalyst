-- Migration 03: Performance Indexes and Query Optimizations
-- Adds composite and covering indexes for high-frequency queries in Elderly Care Platform

-- 1. Medications & Adherence Logs
CREATE INDEX IF NOT EXISTS idx_medications_user_time 
  ON medications (user_id, time);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_scheduled 
  ON medication_logs (user_id, scheduled_time DESC);

CREATE INDEX IF NOT EXISTS idx_medication_logs_med_status_time 
  ON medication_logs (medication_id, status, scheduled_time DESC);

-- 2. Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_circle_datetime 
  ON appointments (circle_id, datetime ASC);

CREATE INDEX IF NOT EXISTS idx_appointments_elderly_datetime 
  ON appointments (elderly_id, datetime ASC);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
  ON appointments (status, datetime ASC);

-- 3. Care Circles & Membership
CREATE INDEX IF NOT EXISTS idx_care_circles_elderly 
  ON care_circles (elderly_id);

CREATE INDEX IF NOT EXISTS idx_circle_members_circle_status 
  ON circle_members (circle_id, status);

CREATE INDEX IF NOT EXISTS idx_circle_members_user_status 
  ON circle_members (user_id, status);

-- 4. Invite Codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_circle_active 
  ON invite_codes (circle_id, revoked, expires_at);

-- 5. Health Check-ins and Summaries
CREATE INDEX IF NOT EXISTS idx_health_checkins_user_created 
  ON health_checkins (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date 
  ON daily_summaries (user_id, date DESC);

-- 6. Voice Messages
CREATE INDEX IF NOT EXISTS idx_voice_messages_recipient_created 
  ON voice_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_messages_sender_created 
  ON voice_messages (sender_id, created_at DESC);

-- 7. Audit & Notification Logs
CREATE INDEX IF NOT EXISTS idx_audit_log_circle_created 
  ON audit_log (circle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_idempotency 
  ON notification_log (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_notification_log_recipient_sent 
  ON notification_log (recipient_email, sent_at DESC);

-- 8. Caregiver Alerts
CREATE INDEX IF NOT EXISTS idx_caregiver_alerts_caregiver_read 
  ON caregiver_alerts (caregiver_id, is_read, created_at DESC);
