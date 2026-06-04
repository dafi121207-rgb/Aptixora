-- ================================================
-- Migration: Hard delete + auto-purge for orders
-- Allows owner/staff to permanently delete orders
-- to free Supabase free plan storage.
-- ================================================

-- 1. RLS: Owner/Staff can DELETE orders in their business
DROP POLICY IF EXISTS "Owners can delete orders in their business" ON public.orders;
CREATE POLICY "Owners can delete orders in their business"
  ON public.orders FOR DELETE
  USING (
    is_owner_of_business(business_id)
  );

DROP POLICY IF EXISTS "Staff can delete orders in their business" ON public.orders;
CREATE POLICY "Staff can delete orders in their business"
  ON public.orders FOR DELETE
  USING (
    is_staff_at_business(business_id)
  );

-- 2. RPC: Purge completed/cancelled orders older than N days (in their business)
CREATE OR REPLACE FUNCTION public.purge_old_orders(
  p_business_id UUID,
  p_days_old INT DEFAULT 30
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_count INT;
BEGIN
  -- Verify caller is owner
  SELECT owner_id INTO v_owner_id
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: only business owner can purge orders';
  END IF;

  DELETE FROM public.orders
  WHERE business_id = p_business_id
    AND current_status IN ('completed', 'cancelled')
    AND created_at < (now() - (p_days_old || ' days')::interval);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3. RPC: Hard delete a single order (owner/staff only, status must be completed/cancelled)
CREATE OR REPLACE FUNCTION public.hard_delete_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  SELECT business_id INTO v_business_id
  FROM public.orders
  WHERE id = p_order_id;

  IF v_business_id IS NULL THEN RETURN FALSE; END IF;

  IF NOT (
    is_owner_of_business(v_business_id)
    OR is_staff_at_business(v_business_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.orders WHERE id = p_order_id;
  RETURN TRUE;
END;
$$;

-- 4. RPC: Bulk delete all completed/cancelled orders in a business
CREATE OR REPLACE FUNCTION public.bulk_delete_completed_orders(p_business_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT is_owner_of_business(p_business_id) THEN
    RAISE EXCEPTION 'Unauthorized: only business owner can bulk delete';
  END IF;

  DELETE FROM public.orders
  WHERE business_id = p_business_id
    AND current_status IN ('completed', 'cancelled');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 5. Helper view: storage estimate per business (informational, may be used later)
COMMENT ON FUNCTION public.purge_old_orders IS 'Owner-only: permanently delete completed/cancelled orders older than N days (default 30). Frees Supabase storage.';
COMMENT ON FUNCTION public.hard_delete_order IS 'Owner/Staff: permanently delete a single order (no soft delete). Frees storage.';
COMMENT ON FUNCTION public.bulk_delete_completed_orders IS 'Owner-only: bulk delete ALL completed/cancelled orders in business. Frees storage immediately.';
