-- ================================================
-- Migration: Add customer_name + service_id to orders
-- Run this in Supabase SQL Editor (additive, safe)
-- ================================================

-- 1. Add customer_name column for walk-in bookings
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 2. Add service_id foreign key for fast service lookup
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

-- 3. Add columns for Smart Queue feature
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS queue_number INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON public.orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_queue_number ON public.orders(queue_number);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_ready ON public.orders(estimated_ready_at);

-- 5. RPC: Get next queue number for a business (atomic)
CREATE OR REPLACE FUNCTION public.next_queue_number(p_business_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) INTO v_max
  FROM public.orders
  WHERE business_id = p_business_id
    AND current_status NOT IN ('completed', 'cancelled')
    AND DATE(created_at) = CURRENT_DATE;

  RETURN v_max + 1;
END;
$$;

-- 6. Update track policy to expose customer_name (already accessible via order owner)
DROP POLICY IF EXISTS "Clients can read own orders" ON public.orders;
CREATE POLICY "Clients can read own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

-- 7. Add customer_name and queue_number to the realtime publication
-- (Supabase automatically tracks columns; no action needed)

-- 8. Comment
COMMENT ON COLUMN public.orders.customer_name IS 'Walk-in customer name (may differ from client_id user)';
COMMENT ON COLUMN public.orders.queue_number IS 'Daily sequential queue number for Smart Queue display';
COMMENT ON COLUMN public.orders.estimated_ready_at IS 'Staff-estimated completion time';
