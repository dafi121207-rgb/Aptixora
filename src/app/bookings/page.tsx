'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { AptixoraLogo } from '@/components/aptixora-logo';
import { Avatar } from '@/components/ui/avatar';
import { RelativeTime } from '@/components/ui/relative-time';
import { formatSlotDateTime, formatSlotTime } from '@/lib/datetime';
import type { Order, Business, Service } from '@/lib/types';

const businessIcons: Record<string, string> = {
  barbershop: '✂',
  salon: '💇',
  laundry: '🧺',
};

const statusColor: Record<string, string> = {
  pending: 'chip-pending',
  weighing: 'chip-progress',
  processing: 'chip-progress',
  ready: 'chip-completed',
  completed: 'chip-completed',
  cancelled: 'chip-cancelled',
};

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  weighing: 'Ditimbang',
  processing: 'Diproses',
  ready: 'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/bookings');
    }
  }, [user, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data as Order[]);
        const bizIds = [...new Set((data as Order[]).map((o) => o.business_id))];
        if (bizIds.length > 0) {
          const { data: bizs } = await supabase
            .from('businesses')
            .select('*')
            .in('id', bizIds);
          if (bizs) {
            const map: Record<string, Business> = {};
            (bizs as Business[]).forEach((b) => (map[b.id] = b));
            setBusinesses(map);

            const svcIds = (data as Order[])
              .map((o) => o.service_id)
              .filter(Boolean) as string[];
            if (svcIds.length > 0) {
              const { data: svcs } = await supabase
                .from('services')
                .select('*')
                .in('id', svcIds);
              if (svcs) {
                const sm: Record<string, Service> = {};
                (svcs as Service[]).forEach((s) => (sm[s.id] = s));
                setServices(sm);
              }
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user, fetchOrders]);

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      channel = supabase
        .channel('my-bookings', { config: { broadcast: { self: false } } })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${user.id}` },
          () => fetchOrders()
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setTimeout(setup, 1500);
          }
        });
    };
    setup();

    let visTimer: ReturnType<typeof setTimeout> | null = null;
    const onVis = () => {
      if (visTimer) clearTimeout(visTimer);
      visTimer = setTimeout(() => {
        if (document.visibilityState === 'visible') setup();
      }, 800);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (visTimer) clearTimeout(visTimer);
      document.removeEventListener('visibilitychange', onVis);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchOrders]);

  const handleDelete = async (order: Order) => {
    if (!['completed', 'cancelled'].includes(order.current_status)) {
      toast('Hanya pesanan selesai / dibatalkan yang bisa dihapus', 'error');
      return;
    }
    if (!confirm(`Hapus pesanan #${order.queue_number ?? '—'} dari daftar?`)) return;

    setDeletingId(order.id);
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', order.id);

    setDeletingId(null);
    if (error) {
      toast('Gagal menghapus: ' + error.message, 'error');
      return;
    }
    toast('Pesanan dihapus dari daftar', 'success');
    fetchOrders();
  };

  const filtered = useMemo(() => {
    if (filter === 'active') {
      return orders.filter((o) => !['completed', 'cancelled'].includes(o.current_status));
    }
    if (filter === 'done') {
      return orders.filter((o) => ['completed', 'cancelled'].includes(o.current_status));
    }
    return orders;
  }, [orders, filter]);

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-sm text-[var(--color-text-muted)]">Memuat pesanan...</div>
      </div>
    );
  }

  if (!user) return null;

  const activeCount = orders.filter((o) => !['completed', 'cancelled'].includes(o.current_status)).length;
  const doneCount = orders.filter((o) => ['completed', 'cancelled'].includes(o.current_status)).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AptixoraLogo size={26} />
            <span className="font-display font-bold text-sm text-[var(--color-text-primary)]">Aptixora</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            <Link href="/book" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Booking</Link>
            <Link href="/track" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Lacak</Link>
            <Link href="/dashboard" className="text-[var(--color-accent)] hover:underline">Dashboard →</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Pesanan Saya
              </h1>
              <span className="chip text-[10px]" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                👤 Pelanggan
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Halo <span className="font-semibold text-[var(--color-text-primary)]">{user.full_name}</span>! Pantau semua pesanan Anda di sini.
            </p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-[var(--color-surface-secondary)] rounded-lg mb-5 w-fit">
          {[
            { v: 'all' as const, label: 'Semua', count: orders.length },
            { v: 'active' as const, label: 'Aktif', count: activeCount },
            { v: 'done' as const, label: 'Selesai', count: doneCount },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v)}
              className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filter === t.v
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold ${
                filter === t.v ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bento p-8 sm:p-12 text-center">
            <p className="text-base text-[var(--color-text-secondary)] mb-4">
              {orders.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada pesanan di filter ini.'}
            </p>
            <Link href="/book" className="btn btn-primary">
              Booking Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order, i) => {
              const biz = businesses[order.business_id];
              const service = order.service_id ? services[order.service_id] : null;
              const canDelete = ['completed', 'cancelled'].includes(order.current_status);
              return (
                <div
                  key={order.id}
                  className="bento p-4 slide-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={order.customer_name || order.notes || 'Anonim'} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-base text-[var(--color-text-primary)] truncate">
                        {biz?.name || 'Bisnis'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {service ? service.name : 'Layanan'}
                        {order.weight_kg && ` · ${order.weight_kg} kg`}
                      </p>
                    </div>
                    <span className={`chip shrink-0 ${statusColor[order.current_status]}`}>
                      {statusLabel[order.current_status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {order.booking_slot && (
                      <div>
                        <p className="text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                          {biz?.business_type === 'laundry' ? 'Masuk' : 'Jadwal'}
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                          {biz?.business_type === 'laundry'
                            ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : formatSlotTime(order.booking_slot)}
                        </p>
                      </div>
                    )}
                    {order.queue_number !== null && (
                      <div>
                        <p className="text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                          Antrian
                        </p>
                        <p className="font-display font-bold text-[var(--color-accent)] mt-0.5">
                          #{order.queue_number}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                        Total
                      </p>
                      <p className="font-display font-bold text-[var(--color-text-primary)] mt-0.5">
                        Rp{order.total_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2 flex-wrap">
                    {biz && (
                      <Link
                        href={`/book/${biz.id}`}
                        className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        Booking Lagi
                      </Link>
                    )}
                    {canDelete && (
                      <>
                        <span className="text-[var(--color-text-muted)]">·</span>
                        <button
                          onClick={() => handleDelete(order)}
                          disabled={deletingId === order.id}
                          className="text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-50 transition-colors"
                        >
                          {deletingId === order.id ? 'Menghapus...' : '🗑 Hapus'}
                        </button>
                      </>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto flex items-center gap-1">
                      <RelativeTime iso={order.created_at} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
