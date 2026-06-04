-- ================================================
-- Migration: Add queue display to businesses
-- Optional: enable public queue page per business
-- ================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS queue_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS queue_slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_businesses_queue_slug ON public.businesses(queue_slug) WHERE queue_slug IS NOT NULL;

-- Public read policy for queue page (anyone can read active orders of a business with queue_enabled)
DROP POLICY IF EXISTS "Public can read active queue orders" ON public.orders;
CREATE POLICY "Public can read active queue orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (
    current_status NOT IN ('completed', 'cancelled')
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = orders.business_id AND b.queue_enabled = true
    )
  );

COMMENT ON COLUMN public.businesses.queue_enabled IS 'Display active orders on public queue page';
COMMENT ON COLUMN public.businesses.queue_slug IS 'Public URL slug for queue display (e.g. /queue/my-shop)';
