'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';
import { useToast } from '@/context/toast-context';
import { OrderDetail } from '@/components/ui/order-detail';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Greeting } from '@/components/ui/greeting';
import { slotToISO, formatSlotTime } from '@/lib/datetime';
import type { Order, User, Service } from '@/lib/types';

export default function SalonDashboard() {
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

    try {
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
    } catch (err) {
      console.warn('[salon] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [business, user, selectedDate, supabase, isStaff]);

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
        setBookingError('Slot ini sudah dibooking. Pilih waktu atau staf lain.');
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

  const updateStatus = async (orderId: string, status: Order['current_status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ current_status: status })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, current_status: status } : o))
      );
      toast('Status diperbarui', 'success');
    }
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
      <div className="space-y-4">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-80 skeleton-pulse rounded-xl" />
      </div>
    );
  }

  const activeCount = orders.filter(
    (o) => o.current_status === 'pending' || o.current_status === 'processing'
  ).length;

  const totalToday = orders
    .filter((o) => o.current_status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_price, 0);

  const byHour = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return {
      hour,
      orders: orders.filter((o) => {
        if (!o.booking_slot) return false;
        return new Date(o.booking_slot).getHours() === hour;
      }),
    };
  });

  const maxHourOrders = Math.max(...byHour.map((h) => h.orders.length), 1);

  const byStaff = staff.map((s) => {
    const staffOrders = orders.filter((o) => o.staff_id === s.id);
    const active = staffOrders.filter(
      (o) => o.current_status !== 'completed' && o.current_status !== 'cancelled'
    ).length;
    const completed = staffOrders.filter((o) => o.current_status === 'completed').length;
    const revenue = staffOrders
      .filter((o) => o.current_status === 'completed')
      .reduce((s, o) => s + o.total_price, 0);
    const pct = Math.min((active / 8) * 100, 100);
    return { staff: s, active, completed, revenue, pct };
  });

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Greeting name={user?.full_name || ''} className="text-sm text-[var(--color-text-secondary)]" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
            Dashboard Salon
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bento-accent p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Janji Aktif</p>
          <p className="stat-number mt-2">{activeCount}</p>
          <p className="text-xs opacity-70 mt-1">Pending + Proses</p>
        </div>
        <div className="bento p-4 sm:p-5">
          <p className="stat-label">Staf Aktif</p>
          <p className="stat-number text-[var(--color-text-primary)] mt-2">{staff.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Bekerja hari ini</p>
        </div>
        <div className="bento p-4 sm:p-5">
          <p className="stat-label">Pendapatan Hari Ini</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            Rp{(totalToday / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{orders.length} pesanan</p>
        </div>
        <div className="bento-dark p-4 sm:p-5" style={{ background: 'var(--color-sidebar)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-sidebar-text-secondary)' }}>Avg per Booking</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2" style={{ color: 'var(--color-sidebar-text)' }}>
            Rp{orders.length > 0 ? Math.round(totalToday / orders.length / 1000) : 0}k
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-sidebar-text-secondary)' }}>Rata-rata</p>
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
              <option value="">Pilih Staf (opsional)</option>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 bento p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-[var(--color-text-primary)]">
              Timeline Hari Ini
            </h2>
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">{orders.length} booking</span>
          </div>
          {byHour.every((h) => h.orders.length === 0) ? (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">Belum ada booking hari ini.</p>
          ) : (
            <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-40">
              {byHour.map((slot) => {
                const heightPct = (slot.orders.length / maxHourOrders) * 100;
                return (
                  <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="text-[10px] font-bold text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {slot.orders.length}
                    </div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-md transition-all hover:opacity-80"
                        style={{
                          height: `${Math.max(heightPct, slot.orders.length > 0 ? 12 : 0)}%`,
                          backgroundColor: slot.orders.length > 0
                            ? (slot.orders.some((o) => o.current_status === 'processing') ? 'var(--color-accent)' : 'var(--color-accent-light)')
                            : 'var(--color-surface-secondary)',
                          minHeight: slot.orders.length > 0 ? '8px' : '0',
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] font-medium">
                      {slot.hour}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bento p-4 sm:p-5">
          <h2 className="font-display font-bold text-base mb-3 text-[var(--color-text-primary)]">
            Utilisasi Staf
          </h2>
          {byStaff.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Belum ada staf.</p>
          ) : (
            <div className="space-y-3">
              {byStaff.map(({ staff: s, active, revenue, pct }) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] text-xs font-semibold shrink-0">
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{s.full_name}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-accent)]">{active} aktif</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-secondary)] rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 70 ? 'var(--color-warning)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 text-right">
                    Rp{revenue.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bento p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base text-[var(--color-text-primary)]">Daftar Booking</h2>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">{orders.length} entri</span>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">Belum ada janji temu hari ini.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {orders.map((order, i) => {
              const service = services.find((s) => s.id === order.service_id);
              const staffMember = staff.find((s) => s.id === order.staff_id);
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="text-left bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-3 hover:border-[var(--color-accent)] hover:shadow-md transition-all slide-up group"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {order.booking_slot && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {formatSlotTime(order.booking_slot)}
                      </p>
                    )}
                    <span className={`chip ${statusColor[order.current_status]}`}>
                      {statusLabel[order.current_status]}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-primary)] font-medium truncate">
                    {order.customer_name || 'Pelanggan'}
                  </p>
                  {service && (
                    <p className="text-[10px] text-[var(--color-text-secondary)] truncate mt-0.5">
                      {service.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-semibold text-[var(--color-accent)]">
                      Rp{order.total_price.toLocaleString('id-ID')}
                    </span>
                    {staffMember && (
                      <span className="text-[10px] text-[var(--color-text-muted)] truncate ml-1">
                        {staffMember.full_name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  {isOwner && order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                    <select
                      value={order.current_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(order.id, e.target.value as Order['current_status'])}
                      className="w-full mt-2 px-2 py-1 text-[10px] font-medium border border-[var(--color-border)] rounded bg-[var(--color-surface-card)]"
                    >
                      <option value="pending">→ Menunggu</option>
                      <option value="processing">→ Proses</option>
                      <option value="completed">→ Selesai</option>
                      <option value="cancelled">→ Batal</option>
                    </select>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
