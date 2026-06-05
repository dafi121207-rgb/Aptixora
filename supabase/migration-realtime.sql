-- =============================================================
-- Migration: Enable Supabase Realtime for orders & businesses
--
-- Default Supabase: tables TIDAK otomatis masuk ke realtime
-- publication. Channel connect tapi event tidak pernah fired.
-- Migration ini menambahkan `orders` dan `businesses` ke
-- publication supabase_realtime sehingga perubahan row
-- (INSERT/UPDATE/DELETE) akan di-broadcast via WebSocket.
-- =============================================================

DO $$
BEGIN
  -- 1. Orders: realtime update (insert/update/delete + soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- 2. Businesses: realtime update (owner/staff join, name change, queue toggle)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'businesses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
  END IF;

  -- 3. Services: realtime update (service list sync ke queue display)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL agar UPDATE event membawa semua kolom,
-- bukan hanya primary key. Tanpa ini, payload.new hanya berisi id
-- dan recipient tidak bisa update UI dengan field baru.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
