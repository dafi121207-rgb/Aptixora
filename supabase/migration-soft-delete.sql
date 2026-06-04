-- ================================================
-- Migration: Soft delete for customer orders
-- Allows customers to hide their own completed/cancelled orders
-- from their view without permanently deleting data.
-- ================================================

-- 1. Add deleted_at column (NULL = visible, timestamp = hidden)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Index for fast filtering of visible orders
CREATE INDEX IF NOT EXISTS idx_orders_client_deleted 
  ON public.orders(client_id, deleted_at) 
  WHERE deleted_at IS NULL;

-- 3. RLS: Clients can soft-delete (UPDATE) their own orders
--     ONLY if status is 'completed' or 'cancelled'
DROP POLICY IF EXISTS "Clients can soft-delete own completed orders" ON public.orders;
CREATE POLICY "Clients can soft-delete own completed orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    AND current_status IN ('completed', 'cancelled')
    AND deleted_at IS NULL
  )
  WITH CHECK (
    client_id = (SELECT auth.uid())
    AND deleted_at IS NOT NULL
  );

-- 4. Owner/staff can also see deleted orders (admin view)
DROP POLICY IF EXISTS "Owners can see deleted orders in their business" ON public.orders;
CREATE POLICY "Owners can see deleted orders in their business"
  ON public.orders FOR SELECT
  USING (
    is_owner_of_business(business_id)
    OR is_staff_at_business(business_id)
  );

-- 5. RLS: Clients only see their non-deleted orders
DROP POLICY IF EXISTS "Clients can read own non-deleted orders" ON public.orders;
CREATE POLICY "Clients can read own non-deleted orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    AND deleted_at IS NULL
  );

-- 6. Public queue: also exclude deleted
DROP POLICY IF EXISTS "Public can read active queue orders" ON public.orders;
CREATE POLICY "Public can read active queue orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND current_status NOT IN ('completed', 'cancelled')
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = orders.business_id AND b.queue_enabled = true
    )
  );

-- 7. Add comment
COMMENT ON COLUMN public.orders.deleted_at IS 'Soft-delete timestamp. NULL = visible, set = hidden from client view.';
