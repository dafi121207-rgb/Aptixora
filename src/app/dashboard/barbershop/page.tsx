'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';
import { useToast } from '@/context/toast-context';
import { OrderDetail } from '@/components/ui/order-detail';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Greeting } from '@/components/ui/greeting';
import { slotToISO } from '@/lib/datetime';
import type { Order, User, Service } from '@/lib/types';

export default function BarbershopDashboard() {
  const { business, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showBooking, setShowBooking] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const isOwner = user?.role === 'OWNER';
  const isStaff = user?.role === 'STAFF';

  const fetchData = useCallback(async () => {
    if (!business || !user) { setLoading(false); return; }

    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .gte('booking_slot', `${selectedDate}T00:00:00`);

    if (isStaff) ordersQuery = ordersQuery.eq('staff_id', user.id);

    const [ordersRes, servicesRes] = await Promise.all([
      ordersQuery
        .lt('booking_slot', `${selectedDate}T23:59:59`)
        .order('booking_slot'),
      supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (servicesRes.data) setServices(servicesRes.data as Service[]);

    const [orderStaffRes, sbStaffRes] = await Promise.all([
      supabase
        .from('orders')
        .select('staff_id, users!staff_id(full_name, id)')
        .eq('business_id', business.id)
        .not('staff_id', 'is', null),
      supabase
        .from('staff_business')
        .select('user_id, users!user_id(full_name, id)')
        .eq('business_id', business.id),
    ]);

    const staffMap = new Map<string, User>();
    orderStaffRes.data?.forEach((o: any) => {
      if (o.users && !staffMap.has(o.users.id)) {
        staffMap.set(o.users.id, o.users as User);
      }
    });
    sbStaffRes.data?.forEach((s: any) => {
      if (s.users && !staffMap.has(s.users.id)) {
        staffMap.set(s.users.id, s.users as User);
      }
    });
    setStaff(Array.from(staffMap.values()));

    setLoading(false);
  }, [business, selectedDate, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeOrders(business?.id, useCallback(() => {
    fetchData();
  }, [fetchData]));

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user) return;
    setBookingError(null);

    const bookingSlot = slotToISO(selectedDate, bookingTime);

    if (selectedStaff) {
      const { data: clash } = await supabase
        .from('orders')
        .select('id')
        .eq('business_id', business.id)
        .eq('staff_id', selectedStaff)
        .eq('booking_slot', bookingSlot)
        .not('current_status', 'eq', 'cancelled');

      if (clash && clash.length > 0) {
        setBookingError('Slot ini sudah dibooking. Pilih waktu atau staff lain.');
        return;
      }
    }

    const service = services.find((s) => s.id === selectedService);
    const { error } = await supabase.from('orders').insert({
      business_id: business.id,
      client_id: user.id,
      service_id: selectedService || null,
      staff_id: selectedStaff || null,
      total_price: service?.price ?? 0,
      booking_slot: bookingSlot,
      current_status: 'pending',
      customer_name: customerName || user.full_name || null,
    });

    if (error) {
      setBookingError(error.message);
      return;
    }

    toast('Booking berhasil dibuat', 'success');
    setShowBooking(false);
    setCustomerName('');
    setSelectedStaff('');
    setSelectedService('');
    setBookingTime('09:00');
    fetchData();
  };

  const statusColor: Record<string, string> = {
    pending: 'chip-pending',
    processing: 'chip-progress',
    completed: 'chip-completed',
    cancelled: 'chip-cancelled',
  };

  const statusLabel: Record<string, string> = {
    pending: 'Menunggu',
    processing: 'Diproses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-80 skeleton-pulse rounded-xl" />
      </div>
    );
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Greeting name={user?.full_name || ''} className="text-sm text-[var(--color-text-secondary)]" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
            Dashboard Barbershop
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 capitalize">
            {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
          />
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="btn btn-primary"
          >
            {showBooking ? 'Batal' : '+ Booking'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bento p-4 sm:p-5">
          <p className="stat-label">Antrean</p>
          <p className="stat-number text-[var(--color-text-primary)] mt-2">
            {orders.filter((o) => o.current_status === 'pending').length}
          </p>
        </div>
        <div className="bento p-4 sm:p-5">
          <p className="stat-label">Kapster</p>
          <p className="stat-number text-[var(--color-text-primary)] mt-2">{staff.length}</p>
        </div>
        <div className="bento-accent p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Sedang Dilayani</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">
            {orders.filter((o) => o.current_status === 'processing').length}
          </p>
        </div>
      </div>

      {showBooking && (
        <form onSubmit={handleBooking} className="bento p-4 sm:p-5 space-y-3 slide-down">
          <h2 className="font-display font-bold text-base text-[var(--color-text-primary)]">
            Booking Baru
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan"
              className="input-field"
            />
            <select
              required
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input-field"
            >
              <option value="">Pilih Layanan</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — Rp{svc.price.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="input-field"
            >
              <option value="">Pilih Kapster (opsional)</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <input
              type="time"
              required
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="input-field"
            />
          </div>
          {bookingError && <p className="text-sm text-[var(--color-danger)]">{bookingError}</p>}
          <button type="submit" className="btn btn-primary">Konfirmasi Booking</button>
        </form>
      )}

      <div className="bento overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-[var(--color-text-primary)]">Jadwal Hari Ini</h2>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">{orders.length} appointment</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {hours.map((hour) => {
            const hourOrders = orders.filter((o) => {
              if (!o.booking_slot) return false;
              return new Date(o.booking_slot).getHours() === hour;
            });
            if (hourOrders.length === 0) return null;
            return (
              <div key={hour} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr]">
                <div className="p-2 sm:p-3 text-xs font-bold text-[var(--color-text-secondary)] border-r border-[var(--color-border)] flex items-center">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="p-2 sm:p-3 space-y-1.5">
                  {hourOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`w-full text-left px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80 ${statusColor[order.current_status]}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {order.customer_name || 'Pelanggan'} {order.staff_id && '· '}
                        </span>
                        <span className="font-bold shrink-0">
                          Rp{order.total_price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
              Belum ada booking hari ini.
            </p>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
