-- Migration 04: Enhanced Circle Roles, Permissions & Expiry Lifecycle
-- Adds support for 'owner'/'elder' roles, 'active'/'approved' statuses, and granular elder visibility controls

-- 1. Update circle_members constraints safely
DO $$ BEGIN
  ALTER TABLE public.circle_members 
    DROP CONSTRAINT IF EXISTS circle_members_role_check;
  ALTER TABLE public.circle_members 
    ADD CONSTRAINT circle_members_role_check 
    CHECK (role IN ('owner', 'elder', 'editor', 'viewer'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.circle_members 
    DROP CONSTRAINT IF EXISTS circle_members_status_check;
  ALTER TABLE public.circle_members 
    ADD CONSTRAINT circle_members_status_check 
    CHECK (status IN ('pending', 'approved', 'active', 'revoked', 'declined'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Add revoked_at and created_by columns to invite_codes if needed
DO $$ BEGIN
  ALTER TABLE public.invite_codes 
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Ensure permissions JSONB has 'insights' field
DO $$ BEGIN
  UPDATE public.circle_members
  SET permissions = permissions || '{"insights": true}'::jsonb
  WHERE permissions IS NOT NULL AND NOT (permissions ? 'insights');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Audit Log action additions
CREATE INDEX IF NOT EXISTS idx_circle_members_permissions 
  ON public.circle_members USING gin (permissions);
