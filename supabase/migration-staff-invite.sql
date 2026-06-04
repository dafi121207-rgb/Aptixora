-- =============================================================
-- Migration: Add staff invitation system
-- 1. Create staff_invitations table
-- 2. Create staff_business mapping table  
-- 3. Add RLS policies + SECURITY DEFINER RPC for accepting
-- 4. Add indexes
-- NOTE: handle_new_user trigger is NOT modified.
-- Staff accepts invitation via UI after signup.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_business (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON public.staff_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_business ON public.staff_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_user ON public.staff_business(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_biz ON public.staff_business(business_id);

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_business ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can CRUD invitations for their business" ON public.staff_invitations;
CREATE POLICY "Owners can CRUD invitations for their business"
  ON public.staff_invitations
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

DROP POLICY IF EXISTS "Staff can view own business mapping" ON public.staff_business;
CREATE POLICY "Staff can view own business mapping"
  ON public.staff_business FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage staff_business" ON public.staff_business;
CREATE POLICY "Owners can manage staff_business"
  ON public.staff_business
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

-- Fix owners can read staff linked via staff_business (not just orders)
DROP POLICY IF EXISTS "Business owners can read associated users" ON public.users;
CREATE POLICY "Business owners can read associated users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.business_id = b.id
        AND (o.staff_id = users.id OR o.client_id = users.id)
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.user_id = users.id
      AND is_owner_of_business(sb.business_id)
    )
  );

-- Fix is_staff_at_business to also check staff_business table
CREATE OR REPLACE FUNCTION public.is_staff_at_business(business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE business_id = $1 AND staff_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.staff_business
    WHERE business_id = $1 AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

-- Staff can create orders (needed for walk-in bookings)
DROP POLICY IF EXISTS "Staff can create orders in their business" ON public.orders;
CREATE POLICY "Staff can create orders in their business"
  ON public.orders FOR INSERT
  WITH CHECK (is_staff_at_business(business_id));

-- Relax staff update to any order in business (not just assigned)
DROP POLICY IF EXISTS "Staff can update assigned orders" ON public.orders;
CREATE POLICY "Staff can update orders in their business"
  ON public.orders FOR UPDATE
  USING (is_staff_at_business(business_id))
  WITH CHECK (is_staff_at_business(business_id));

-- RPC: Accept staff invitation (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(p_invitation_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv RECORD;
  v_user_id UUID;
BEGIN
  SELECT * INTO inv FROM public.staff_invitations WHERE id = p_invitation_id AND status = 'pending';
  IF inv.id IS NULL THEN RETURN FALSE; END IF;

  SELECT id INTO v_user_id FROM public.users WHERE email = inv.email;
  IF v_user_id IS NULL THEN RETURN FALSE; END IF;

  INSERT INTO public.staff_business (user_id, business_id) VALUES (v_user_id, inv.business_id)
  ON CONFLICT (user_id, business_id) DO NOTHING;

  UPDATE public.users SET role = 'STAFF' WHERE id = v_user_id AND role = 'CLIENT';
  UPDATE public.staff_invitations SET status = 'accepted' WHERE id = p_invitation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
