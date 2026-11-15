-- Migration 05: Automated Auth Trigger & Sovereign Profile Creation
-- Solves RLS violation on public.users during signup across all roles.

-- 1. Create or replace the security definer function to handle new users from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_role TEXT;
  v_normalized_role TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract metadata safely
  v_raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));
  v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');

  -- Validate role and map safely to allowed CHECK constraint values ('elderly_user' | 'caregiver')
  IF v_raw_role IN ('elderly_user', 'elder', 'senior', 'owner') THEN
    v_normalized_role := 'elderly_user';
  ELSIF v_raw_role IN ('caregiver', 'family', 'clinician', 'doctor', 'editor', 'viewer') THEN
    v_normalized_role := 'caregiver';
  ELSE
    -- Default safe fallback to elderly_user
    v_normalized_role := 'elderly_user';
  END IF;

  -- Insert profile row with security definer privileges (bypasses RLS)
  INSERT INTO public.users (
    id,
    email,
    role,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_normalized_role,
    v_full_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent signup failure even if profile insert has non-critical issue
    RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if present and recreate on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure INSERT policy on public.users allows authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON public.users;
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Ensure SELECT and UPDATE policies exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.users FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;
