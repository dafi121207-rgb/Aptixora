'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { AptixoraLogo } from '@/components/aptixora-logo';
import { formatSlotDateTime } from '@/lib/datetime';
import type { Order } from '@/lib/types';

const statusIcon: Record<string, string> = {
  pending: '⏳',
  weighing: '⚖',
  processing: '🔄',
  ready: '✅',
  completed: '✓',
  cancelled: '✕',
};

const statusLabel: Record<string, string> = {
  pending: 'Pesanan Diterima',
  weighing: 'Ditimbang',
  processing: 'Sedang Diproses',
  ready: 'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const statusOrder = ['pending', 'weighing', 'processing', 'ready', 'completed'];

export default function TrackPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchOrders();
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('track-orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${user.id}` },
        () => fetchOrders()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  const currentStepIndex = (status: string) => {
    const idx = statusOrder.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="h-8 skeleton-pulse rounded w-48" />
          <div className="h-32 skeleton-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AptixoraLogo size={26} />
            <span className="font-display font-bold text-sm text-[var(--color-text-primary)]">Aptixora</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            <Link href="/book" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Booking</Link>
            <Link href="/bookings" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Pesanan Saya</Link>
            <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">← Beranda</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Lacak Pesanan
            </h1>
            <span className="chip text-[10px]" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              👤 Pelanggan
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Pantau status layanan Anda secara real-time
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bento p-8 sm:p-12 text-center">
            <p className="text-base text-[var(--color-text-secondary)] mb-4">
              Belum ada pesanan.
            </p>
            <button
              onClick={() => router.push('/book')}
              className="btn btn-primary"
            >
              Booking Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order, i) => {
              const stepIdx = currentStepIndex(order.current_status);
              const isCancelled = order.current_status === 'cancelled';
              const isActive = stepIdx >= 0;

              return (
                <div
                  key={order.id}
                  className="bento p-4 sm:p-5 slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      {order.queue_number !== null && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5 rounded mb-1.5">
                          Antrian #{order.queue_number}
                        </span>
                      )}
                      <p className="font-display font-bold text-base text-[var(--color-text-primary)]">
                        {statusIcon[order.current_status]} {statusLabel[order.current_status]}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {formatSlotDateTime(order.created_at)}
                      </p>
                    </div>
                    <p className="font-display font-bold text-lg text-[var(--color-text-primary)] shrink-0">
                      Rp{order.total_price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {order.weight_kg && (
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3 inline-block bg-[var(--color-surface-secondary)] px-2 py-1 rounded">
                      Berat: {order.weight_kg} kg
                    </p>
                  )}

                  {!isCancelled && isActive && (
                    <div className="mt-4">
                      <div className="flex items-center">
                        {statusOrder.map((s, i) => {
                          const isReached = i <= stepIdx;
                          const isCurrent = i === stepIdx;
                          return (
                            <div key={s} className="flex-1 flex flex-col items-center relative">
                              {i < statusOrder.length - 1 && (
                                <div
                                  className="absolute top-2 left-1/2 w-full h-0.5"
                                  style={{
                                    backgroundColor: i < stepIdx ? 'var(--color-accent)' : 'var(--color-border)',
                                  }}
                                />
                              )}
                              <div
                                className={`w-4 h-4 rounded-full relative z-10 transition-all duration-500 ${
                                  isReached
                                    ? 'bg-[var(--color-accent)]'
                                    : 'bg-[var(--color-border)]'
                                } ${isCurrent ? 'ring-4 ring-[var(--color-accent-light)] scale-110' : ''}`}
                              />
                              <p
                                className={`text-[10px] mt-1.5 text-center font-medium ${
                                  isReached
                                    ? 'text-[var(--color-accent)]'
                                    : 'text-[var(--color-text-secondary)]'
                                }`}
                              >
                                {['Diterima', 'Timbang', 'Proses', 'Siap', 'Selesai'][i]}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-danger-light)] text-sm text-[var(--color-danger)] font-semibold">
                      Pesanan dibatalkan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
