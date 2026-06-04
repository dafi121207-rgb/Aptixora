-- =============================================================
-- Aptixora: Multi-Tenant SaaS Platform
-- Complete Database Schema for Supabase / PostgreSQL
-- Version: 1.0.0
-- Target: Barbershop, Salon, Laundry
-- =============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
CREATE TYPE public.user_role AS ENUM ('OWNER', 'STAFF', 'CLIENT');
CREATE TYPE public.business_type AS ENUM ('barbershop', 'salon', 'laundry');
CREATE TYPE public.order_status AS ENUM ('pending', 'weighing', 'processing', 'ready', 'completed', 'cancelled');

-- 3. Users Table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Businesses Table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type business_type NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Services Table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  unit_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  current_status order_status NOT NULL DEFAULT 'pending',
  weight_kg DECIMAL(6,2) CHECK (weight_kg IS NULL OR weight_kg > 0),
  booking_slot TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Staff Invitations Table (for invitation-based staff onboarding)
CREATE TABLE public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Staff-Business Mapping (links staff to business without requiring orders)
CREATE TABLE public.staff_business (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- =============================================================
-- 9. Indexes
-- =============================================================

-- PRD Wajib: INDEX for business_type
CREATE INDEX idx_businesses_business_type ON public.businesses(business_type);

-- Foreign Key Indexes
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);

-- Performance & Filter Indexes
CREATE INDEX idx_orders_current_status ON public.orders(current_status);
CREATE INDEX idx_orders_booking_slot ON public.orders(booking_slot);
CREATE INDEX idx_users_role ON public.users(role);

-- Composite: Dashboard query by business + status
CREATE INDEX idx_orders_business_status ON public.orders(business_id, current_status);

-- Composite: Booking slot lookup (barbershop/salon) — partial: only non-null slots
CREATE INDEX idx_orders_business_slot ON public.orders(business_id, booking_slot)
  WHERE booking_slot IS NOT NULL;

-- Composite: Laundry weight queries — partial: only weight rows
CREATE INDEX idx_orders_business_weight ON public.orders(business_id, weight_kg)
  WHERE weight_kg IS NOT NULL;

-- Partial Unique: Prevent exact duplicate active bookings
CREATE UNIQUE INDEX idx_orders_unique_booking
  ON public.orders(business_id, staff_id, booking_slot)
  WHERE booking_slot IS NOT NULL AND staff_id IS NOT NULL AND current_status != 'cancelled';

-- Staff invitation lookup by email
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email, status);
CREATE INDEX idx_staff_invitations_business ON public.staff_invitations(business_id);

-- Staff-business mapping lookup
CREATE INDEX idx_staff_business_user ON public.staff_business(user_id);
CREATE INDEX idx_staff_business_biz ON public.staff_business(business_id);

-- =============================================================
-- 11. Updated_at Trigger (all tables)
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 12. Auto-Create Public User Profile on Auth Signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'CLIENT'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 13. Auto-Seed Default Services on Business Creation
-- =============================================================
CREATE OR REPLACE FUNCTION public.seed_default_services()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  CASE NEW.business_type
    WHEN 'barbershop' THEN
      INSERT INTO public.services (business_id, name, price, duration_minutes, unit_type) VALUES
        (NEW.id, 'Potong Rambut', 50000, 30, 'sesi'),
        (NEW.id, 'Cuci + Potong', 70000, 45, 'sesi'),
        (NEW.id, 'Cukur Jenggot', 25000, 15, 'sesi'),
        (NEW.id, 'Creambath', 80000, 45, 'sesi'),
        (NEW.id, 'Catok Rambut', 60000, 30, 'sesi');
    WHEN 'salon' THEN
      INSERT INTO public.services (business_id, name, price, duration_minutes, unit_type) VALUES
        (NEW.id, 'Potong Rambut Wanita', 75000, 45, 'sesi'),
        (NEW.id, 'Blow Dry', 50000, 30, 'sesi'),
        (NEW.id, 'Hair Coloring', 200000, 120, 'sesi'),
        (NEW.id, 'Smoothing', 350000, 180, 'sesi'),
        (NEW.id, 'Creambath + Masker', 100000, 60, 'sesi'),
        (NEW.id, 'Manicure', 80000, 45, 'sesi');
    WHEN 'laundry' THEN
      INSERT INTO public.services (business_id, name, price, duration_minutes, unit_type) VALUES
        (NEW.id, 'Cuci Kering', 7000, 1440, 'kg'),
        (NEW.id, 'Cuci + Setrika', 12000, 2880, 'kg'),
        (NEW.id, 'Setrika Saja', 8000, 1440, 'kg'),
        (NEW.id, 'Dry Cleaning', 25000, 4320, 'kg'),
        (NEW.id, 'Selimut/Bedcover', 35000, 2880, 'pcs');
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_seed_default_services
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_services();

-- =============================================================
-- 14. RLS Helper Functions (SECURITY DEFINER to bypass RLS recursion)
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_owner_of_business(business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = business_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

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

CREATE OR REPLACE FUNCTION public.is_client_at_business(business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE business_id = $1 AND client_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.can_access_business(business_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = $1
    AND (
      b.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.orders o WHERE o.business_id = b.id AND o.staff_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.orders o WHERE o.business_id = b.id AND o.client_id = auth.uid())
    )
  );
$$ LANGUAGE sql STABLE;

-- =============================================================
-- 15. Enable Row Level Security
-- =============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 16. RLS for staff_invitations & staff_business
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_business ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can CRUD invitations for their business"
  ON public.staff_invitations
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

CREATE POLICY "Staff can view own business mapping"
  ON public.staff_business FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can manage staff_business"
  ON public.staff_business
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

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

-- =============================================================
-- 17. RLS Policies — users
-- =============================================================
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

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

CREATE POLICY "Clients can read staff assigned to their orders"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.client_id = auth.uid()
      AND o.staff_id = users.id
    )
  );

-- =============================================================
-- 18. RLS Policies — businesses
-- =============================================================
CREATE POLICY "Owner full access to own businesses"
  ON public.businesses
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Staff can view assigned business"
  ON public.businesses FOR SELECT
  USING (is_staff_at_business(id));

CREATE POLICY "Clients can view business of their orders"
  ON public.businesses FOR SELECT
  USING (is_client_at_business(id));

-- =============================================================
-- 19. RLS Policies — services
-- =============================================================
CREATE POLICY "Owner full access to own services"
  ON public.services
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

CREATE POLICY "Staff can view services of their business"
  ON public.services FOR SELECT
  USING (is_staff_at_business(business_id));

CREATE POLICY "Clients can view services of their business"
  ON public.services FOR SELECT
  USING (is_client_at_business(business_id));

-- =============================================================
-- 20. RLS Policies — orders
-- =============================================================
CREATE POLICY "Owner full access to all orders in business"
  ON public.orders
  USING (is_owner_of_business(business_id))
  WITH CHECK (is_owner_of_business(business_id));

CREATE POLICY "Staff can view orders in their business"
  ON public.orders FOR SELECT
  USING (is_staff_at_business(business_id));

CREATE POLICY "Staff can create orders in their business"
  ON public.orders FOR INSERT
  WITH CHECK (is_staff_at_business(business_id));

CREATE POLICY "Staff can update orders in their business"
  ON public.orders FOR UPDATE
  USING (is_staff_at_business(business_id))
  WITH CHECK (is_staff_at_business(business_id));

CREATE POLICY "Clients can view own orders"
  ON public.orders FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own pending orders"
  ON public.orders FOR UPDATE
  USING (client_id = auth.uid() AND current_status = 'pending')
  WITH CHECK (client_id = auth.uid() AND current_status = 'pending');
