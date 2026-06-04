-- =============================================================
-- Migration: Fix RLS policy blocking role updates
-- Masalah: WITH CHECK membandingkan role baru == role lama,
--          sehingga update CLIENT→OWNER ditolak.
-- Fix: Hapus policy lama, buat baru tanpa role restriction.
-- =============================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
