// ============================================================================
// APTIXORA — MASTER TYPE DEFINITIONS
// Single source of truth for all TypeScript types across the project.
// These mirror the Supabase schema exactly.
// ============================================================================

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type BusinessType = 'barbershop' | 'salon' | 'laundry'

export type UserRole = 'owner' | 'staff' | 'client'

export type OrderStatusBarber =
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type OrderStatusLaundry =
  | 'received'
  | 'washing'
  | 'drying'
  | 'ironing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

export type OrderStatus = OrderStatusBarber | OrderStatusLaundry

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'other'

export type ServiceUnit = 'session' | 'kg' | 'piece'

// ─── SETTINGS JSON (business.settings) ───────────────────────────────────────
// This is the "DNA payload" loaded at login that drives the Switching Engine.

export interface BusinessSettings {
  operating_hours: {
    open:  string  // "08:00"
    close: string  // "21:00"
    days:  number[] // [1,2,3,4,5,6,0] — 0=Sun, 1=Mon...
  }
  slot_duration_minutes: number
  max_queue_size: number
  currency: string
  notifications_enabled: boolean
  booking_enabled: boolean
}

// ─── DATABASE ROW TYPES ───────────────────────────────────────────────────────

export interface Business {
  id:            string
  owner_id:      string
  name:          string
  slug:          string | null
  business_type: BusinessType
  phone:         string | null
  address:       string | null
  city:          string | null
  logo_url:      string | null
  settings:      BusinessSettings
  is_active:     boolean
  created_at:    string
  updated_at:    string
}

export interface Profile {
  id:          string
  business_id: string | null
  role:        UserRole
  full_name:   string | null
  phone:       string | null
  avatar_url:  string | null
  is_active:   boolean
  created_at:  string
  updated_at:  string
}

export interface Staff {
  id:               string
  business_id:      string
  profile_id:       string | null
  name:             string
  phone:            string | null
  avatar_url:       string | null
  specializations:  string[] | null
  commission_rate:  number
  commission_type:  'percentage' | 'fixed'
  is_active:        boolean
  created_at:       string
  updated_at:       string
}

export interface Service {
  id:               string
  business_id:      string
  name:             string
  description:      string | null
  price:            number
  unit:             ServiceUnit
  duration_minutes: number | null   // barbershop/salon only
  min_weight_kg:    number | null   // laundry only
  eligible_staff:   string[] | null
  category:         string | null
  is_active:        boolean
  sort_order:       number
  created_at:       string
  updated_at:       string
}

export interface Client {
  id:            string
  business_id:   string
  profile_id:    string | null
  name:          string
  phone:         string | null
  email:         string | null
  notes:         string | null
  total_visits:  number
  total_spent:   number
  last_visit_at: string | null
  created_at:    string
  updated_at:    string
}

export interface Order {
  id:               string
  business_id:      string
  client_id:        string | null
  staff_id:         string | null
  order_number:     string
  queue_number:     number | null
  status_barber:    OrderStatusBarber | null
  status_laundry:   OrderStatusLaundry | null
  booking_date:     string | null   // ISO date
  booking_start:    string | null   // "HH:MM"
  booking_end:      string | null   // "HH:MM"
  weight_kg:        number | null
  estimated_done_at: string | null
  pickup_at:        string | null
  delivery_address: string | null
  subtotal:         number
  discount_amount:  number
  tax_amount:       number
  total_amount:     number
  payment_status:   PaymentStatus
  payment_method:   PaymentMethod | null
  paid_at:          string | null
  commission_amount: number | null
  notes:            string | null
  created_at:       string
  updated_at:       string
}

export interface OrderItem {
  id:         string
  order_id:   string
  service_id: string | null
  name:       string
  unit_price: number
  quantity:   number
  subtotal:   number
  notes:      string | null
  created_at: string
}

export interface StatusLog {
  id:          string
  order_id:    string
  changed_by:  string
  from_status: string | null
  to_status:   string
  notes:       string | null
  created_at:  string
}

export interface Notification {
  id:           string
  business_id:  string
  recipient_id: string
  type:         string
  title:        string
  body:         string
  data:         Record<string, unknown> | null
  is_read:      boolean
  created_at:   string
}

// ─── JOIN / ENRICHED TYPES ────────────────────────────────────────────────────

export type OrderWithRelations = Order & {
  client:     Pick<Client, 'id' | 'name' | 'phone'> | null
  staff:      Pick<Staff, 'id' | 'name' | 'avatar_url'> | null
  order_items: OrderItem[]
}

export type StaffWithProfile = Staff & {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

// ─── VIEW TYPES ───────────────────────────────────────────────────────────────

export interface ActiveQueueRow {
  id:           string
  business_id:  string
  queue_number: number | null
  order_number: string
  status_barber: OrderStatusBarber | null
  booking_date:  string | null
  booking_start: string | null
  booking_end:   string | null
  created_at:    string
  client_name:   string | null
  client_phone:  string | null
  staff_name:    string | null
}

export interface LaundryBoardRow {
  id:               string
  business_id:      string
  order_number:     string
  status_laundry:   OrderStatusLaundry | null
  weight_kg:        number | null
  estimated_done_at: string | null
  created_at:       string
  client_name:      string | null
  client_phone:     string | null
  staff_name:       string | null
}

export interface DailySummary {
  business_id:      string
  summary_date:     string
  total_orders:     number
  paid_orders:      number
  revenue_total:    number
  commission_total: number
  unique_clients:   number
  active_staff:     number
}

// ─── SWITCHING ENGINE TYPES ───────────────────────────────────────────────────
// The runtime payload that powers all conditional rendering.

export interface BusinessEngineConfig {
  // Business identity
  businessId:   string
  businessName: string
  businessType: BusinessType
  logoUrl:      string | null
  settings:     BusinessSettings

  // User identity
  userId:   string
  userRole: UserRole
  userName: string | null

  // Derived: computed from businessType at boot
  primaryUnit:    'minutes' | 'kg'
  workflowSteps:  WorkflowStep[]
  featureFlags:   FeatureFlags
}

export interface WorkflowStep {
  key:    string   // matches enum value
  label:  string   // human-readable
  color:  string   // tailwind bg color class
  icon:   string   // lucide icon name
  isFinal: boolean // completed/picked_up = true
}

export interface FeatureFlags {
  hasTimeSlots:    boolean  // barbershop/salon = true
  hasLiveQueue:    boolean  // barbershop/salon = true
  hasWeightInput:  boolean  // laundry = true
  hasKanbanBoard:  boolean  // laundry = true
  hasStaffBooking: boolean  // barbershop/salon = true
  hasDelivery:     boolean  // laundry = true
}

// ─── FORM TYPES ───────────────────────────────────────────────────────────────

export interface CreateOrderBarberForm {
  client_id:    string | null
  client_name:  string       // for new walk-in clients
  client_phone: string
  staff_id:     string
  booking_date: string
  booking_start: string
  services:     { service_id: string; name: string; price: number; duration: number }[]
  notes:        string
  is_walkin:    boolean
}

export interface CreateOrderLaundryForm {
  client_id:    string | null
  client_name:  string
  client_phone: string
  staff_id:     string | null
  weight_kg:    number
  services:     { service_id: string; name: string; price: number; unit: ServiceUnit }[]
  estimated_done_at: string
  notes:        string
  delivery_address: string
}

// ─── API RESPONSE WRAPPER ─────────────────────────────────────────────────────

export type ApiResult<T> =
  | { data: T;    error: null  }
  | { data: null; error: string }

// ─── UI STATE TYPES ───────────────────────────────────────────────────────────

export interface ToastMessage {
  id:      string
  type:    'success' | 'error' | 'warning' | 'info'
  message: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
