-- Migration 06: Fix Circular RLS Recursion on care_circles & circle_members
-- Prevents Postgres error 42P17 (infinite recursion detected in policy for relation "care_circles")
-- by evaluating membership and ownership through SECURITY DEFINER helper functions.

-- 1. SECURITY DEFINER Helper Functions (execute with owner privileges, bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_circle_member(lookup_circle_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = lookup_circle_id
      AND user_id = lookup_user_id
      AND status IN ('approved', 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_editor(lookup_circle_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = lookup_circle_id
      AND user_id = lookup_user_id
      AND role IN ('editor', 'owner', 'elder')
      AND status IN ('approved', 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_elder(lookup_circle_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_circles
    WHERE id = lookup_circle_id
      AND elder_id = lookup_user_id
  );
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.is_circle_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_circle_editor(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_circle_elder(UUID, UUID) TO authenticated, anon;

-- 2. Non-recursive care_circles policies
DROP POLICY IF EXISTS "Users can view their circles" ON public.care_circles;
CREATE POLICY "Users can view their circles"
  ON public.care_circles FOR SELECT
  USING (
    elder_id = auth.uid() OR
    public.is_circle_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Elders can create circle" ON public.care_circles;
CREATE POLICY "Elders can create circle"
  ON public.care_circles FOR INSERT
  WITH CHECK (elder_id = auth.uid());

DROP POLICY IF EXISTS "Elders can update circle" ON public.care_circles;
CREATE POLICY "Elders can update circle"
  ON public.care_circles FOR UPDATE
  USING (elder_id = auth.uid());

-- 3. Non-recursive circle_members policies
DROP POLICY IF EXISTS "Members can view circle members" ON public.circle_members;
CREATE POLICY "Members can view circle members"
  ON public.circle_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_circle_elder(circle_id, auth.uid()) OR
    public.is_circle_member(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can request to join circle" ON public.circle_members;
CREATE POLICY "Users can request to join circle"
  ON public.circle_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Elders can manage circle members" ON public.circle_members;
CREATE POLICY "Elders can manage circle members"
  ON public.circle_members FOR UPDATE
  USING (
    public.is_circle_elder(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Elders can delete members or members can leave" ON public.circle_members;
CREATE POLICY "Elders can delete members or members can leave"
  ON public.circle_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_circle_elder(circle_id, auth.uid())
  );

-- 4. Non-recursive invite_codes policies
DROP POLICY IF EXISTS "Elders and editors can view invite codes" ON public.invite_codes;
CREATE POLICY "Elders and editors can view invite codes"
  ON public.invite_codes FOR SELECT
  USING (
    created_by = auth.uid() OR
    public.is_circle_elder(circle_id, auth.uid()) OR
    public.is_circle_editor(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "Elders and editors can create invite codes" ON public.invite_codes;
CREATE POLICY "Elders and editors can create invite codes"
  ON public.invite_codes FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      public.is_circle_elder(circle_id, auth.uid()) OR
      public.is_circle_editor(circle_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Elders and creators can update invite codes" ON public.invite_codes;
CREATE POLICY "Elders and creators can update invite codes"
  ON public.invite_codes FOR UPDATE
  USING (
    created_by = auth.uid() OR
    public.is_circle_elder(circle_id, auth.uid())
  );
