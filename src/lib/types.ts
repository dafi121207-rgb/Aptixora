export type UserRole = 'OWNER' | 'STAFF' | 'CLIENT';
export type BusinessType = 'barbershop' | 'salon' | 'laundry';
export type OrderStatus = 'pending' | 'weighing' | 'processing' | 'ready' | 'completed' | 'cancelled';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: BusinessType;
  address: string | null;
  phone: string | null;
  queue_enabled: boolean;
  queue_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  unit_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string | null;
  staff_id: string | null;
  total_price: number;
  current_status: OrderStatus;
  weight_kg: number | null;
  booking_slot: string | null;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  queue_number: number | null;
  estimated_ready_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderWithRelations = Order & {
  client: Pick<User, 'id' | 'full_name'>;
  staff: Pick<User, 'id' | 'full_name'> | null;
};

export interface Invitation {
  id: string;
  business_id: string;
  email: string;
  full_name: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}
