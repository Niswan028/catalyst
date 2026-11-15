-- ====================================================
-- Elderly Care & Medication Management Platform Migration
-- Tables: care_circles, circle_members, invite_codes, appointments, audit_log, notification_log
-- ====================================================

-- 1. CARE CIRCLES TABLE
CREATE TABLE IF NOT EXISTS public.care_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CIRCLE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('elder', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  permissions JSONB DEFAULT '{"medications": true, "appointments": true, "health_checkins": true, "voice_messages": true}'::jsonb,
  notification_preferences JSONB DEFAULT '{"upcoming_doses": true, "missed_doses": true, "appointments": true, "weekly_digest": true}'::jsonb,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- 3. INVITE CODES TABLE (Never store raw passcodes - store bcrypt hash)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  code_prefix TEXT NOT NULL, -- e.g. first 2 characters for identification
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  location TEXT,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'done', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES public.care_circles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATION LOG TABLE
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES public.care_circles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'upcoming_dose', 'missed_dose_alert', 'missed_dose_escalation', 'appointment_24h', 'appointment_2h', 'weekly_digest'
  status TEXT NOT NULL DEFAULT 'sent',
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PASSCODE RATE LIMIT TABLE (tracks attempts to prevent brute-force attacks)
CREATE TABLE IF NOT EXISTS public.passcode_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address or user_id
  failed_attempts INTEGER NOT NULL DEFAULT 1,
  first_failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier)
);

-- ====================================================
-- INDEXES FOR EFFICIENCY
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_status ON public.circle_members(circle_id, status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_circle ON public.invite_codes(circle_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_lookup ON public.invite_codes(code_prefix, is_revoked, expires_at);
CREATE INDEX IF NOT EXISTS idx_appointments_circle ON public.appointments(circle_id, datetime);
CREATE INDEX IF NOT EXISTS idx_audit_log_circle ON public.audit_log(circle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_idempotency ON public.notification_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notification_log_circle ON public.notification_log(circle_id, sent_at DESC);

-- ====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

ALTER TABLE public.care_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passcode_rate_limits ENABLE ROW LEVEL SECURITY;

-- CARE CIRCLES POLICIES
-- Users can view circles if they are the elder OR an approved member
CREATE POLICY "Users can view their circles"
  ON public.care_circles FOR SELECT
  USING (
    elder_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = care_circles.id
        AND circle_members.user_id = auth.uid()
        AND circle_members.status = 'approved'
    )
  );

-- Only elders can create their circle
CREATE POLICY "Elders can create circle"
  ON public.care_circles FOR INSERT
  WITH CHECK (elder_id = auth.uid());

-- Elders can update their circle
CREATE POLICY "Elders can update circle"
  ON public.care_circles FOR UPDATE
  USING (elder_id = auth.uid());

-- CIRCLE MEMBERS POLICIES
-- Members can view memberships in their circle
CREATE POLICY "Members can view circle members"
  ON public.circle_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = circle_members.circle_id
        AND care_circles.elder_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.circle_members AS cm
      WHERE cm.circle_id = circle_members.circle_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
    )
  );

-- Users can insert pending membership for themselves (e.g. through passcode verification)
CREATE POLICY "Users can request to join circle"
  ON public.circle_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Elders can update member status, role, and permissions
CREATE POLICY "Elders can manage circle members"
  ON public.circle_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = circle_members.circle_id
        AND care_circles.elder_id = auth.uid()
    )
  );

-- Elders can remove members; members can leave
CREATE POLICY "Elders can delete members or members can leave"
  ON public.circle_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = circle_members.circle_id
        AND care_circles.elder_id = auth.uid()
    )
  );

-- INVITE CODES POLICIES
-- Elders and editors can view invite codes for their circle
CREATE POLICY "Elders and editors can view invite codes"
  ON public.invite_codes FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = invite_codes.circle_id
        AND care_circles.elder_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = invite_codes.circle_id
        AND circle_members.user_id = auth.uid()
        AND circle_members.role = 'editor'
        AND circle_members.status = 'approved'
    )
  );

-- Elders and editors can create invite codes
CREATE POLICY "Elders and editors can create invite codes"
  ON public.invite_codes FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.care_circles
        WHERE care_circles.id = invite_codes.circle_id
          AND care_circles.elder_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_members.circle_id = invite_codes.circle_id
          AND circle_members.user_id = auth.uid()
          AND circle_members.role = 'editor'
          AND circle_members.status = 'approved'
      )
    )
  );

-- Elders can revoke or update invite codes
CREATE POLICY "Elders and creators can update invite codes"
  ON public.invite_codes FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = invite_codes.circle_id
        AND care_circles.elder_id = auth.uid()
    )
  );

-- APPOINTMENTS POLICIES
-- Approved circle members and elders can view appointments
CREATE POLICY "Circle members can view appointments"
  ON public.appointments FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = appointments.circle_id
        AND (
          care_circles.elder_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = care_circles.id
              AND circle_members.user_id = auth.uid()
              AND circle_members.status = 'approved'
              AND (circle_members.permissions->>'appointments')::boolean IS NOT FALSE
          )
        )
    )
  );

-- Elders and editors can insert appointments
CREATE POLICY "Elders and editors can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.care_circles
        WHERE care_circles.id = appointments.circle_id
          AND care_circles.elder_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_members.circle_id = appointments.circle_id
          AND circle_members.user_id = auth.uid()
          AND circle_members.role IN ('elder', 'editor')
          AND circle_members.status = 'approved'
      )
    )
  );

-- Elders and editors can update appointments
CREATE POLICY "Elders and editors can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = appointments.circle_id
        AND (
          care_circles.elder_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = care_circles.id
              AND circle_members.user_id = auth.uid()
              AND circle_members.role IN ('elder', 'editor')
              AND circle_members.status = 'approved'
          )
        )
    )
  );

-- Elders and editors can delete appointments
CREATE POLICY "Elders and editors can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = appointments.circle_id
        AND (
          care_circles.elder_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = care_circles.id
              AND circle_members.user_id = auth.uid()
              AND circle_members.role IN ('elder', 'editor')
              AND circle_members.status = 'approved'
          )
        )
    )
  );

-- AUDIT LOG POLICIES
-- Elders and approved members can view audit log
CREATE POLICY "Circle members can view audit log"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = audit_log.circle_id
        AND (
          care_circles.elder_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = care_circles.id
              AND circle_members.user_id = auth.uid()
              AND circle_members.status = 'approved'
          )
        )
    )
  );

-- Anyone authenticated can insert audit logs for actions they perform
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- NOTIFICATION LOG POLICIES
-- Service role or circle members can view notification log
CREATE POLICY "Circle members can view notifications"
  ON public.notification_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_circles
      WHERE care_circles.id = notification_log.circle_id
        AND care_circles.elder_id = auth.uid()
    )
  );
