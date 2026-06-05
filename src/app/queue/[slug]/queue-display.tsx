'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { NumberFlip } from '@/components/ui/number-flip';
import { LiveClock } from '@/components/ui/live-clock';
import type { Order, Business, Service } from '@/lib/types';

interface Props {
  business: Business;
  initialOrders: Order[];
  initialServices: Record<string, Service>;
}

export function QueueDisplay({ business, initialOrders, initialServices }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [services] = useState<Record<string, Service>>(initialServices);
  const supabase = createClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const handlePayload = (payload: { eventType: string; new: Order | null; old: Order | null }) => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eventType = payload.eventType;
      const newRow = (payload.new ?? {}) as Order;
      const oldRow = (payload.old ?? {}) as Order;

      setOrders((prev) => {
        if (eventType === 'INSERT') {
          if (newRow.deleted_at) return prev;
          if (new Date(newRow.created_at) < todayStart) return prev;
          if (!['pending', 'weighing', 'processing', 'ready'].includes(newRow.current_status)) return prev;
          if (prev.some((o) => o.id === newRow.id)) return prev;
          return [...prev, newRow].sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0));
        }
        if (eventType === 'UPDATE') {
          if (newRow.deleted_at) return prev.filter((o) => o.id !== newRow.id);
          if (!['pending', 'weighing', 'processing', 'ready'].includes(newRow.current_status)) {
            return prev.filter((o) => o.id !== newRow.id);
          }
          return prev.map((o) => (o.id === newRow.id ? newRow : o));
        }
        if (eventType === 'DELETE') {
          return prev.filter((o) => o.id !== oldRow.id);
        }
        return prev;
      });
    };

    const setup = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      channel = supabase
        .channel(`queue:${business.id}`, {
          config: { broadcast: { self: false } },
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
          handlePayload
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setTimeout(setup, 1500);
          }
        });
    };
    setup();

    const onVis = () => {
      if (document.visibilityState === 'visible') setup();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (channel) supabase.removeChannel(channel);
    };
  }, [business.id, supabase]);

  const nowServing = orders.find((o) => o.current_status === 'processing' || o.current_status === 'weighing');
  const upNext = orders.filter((o) => o.current_status === 'pending').slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0c1825] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-3">
            📺 Tampilan Publik · Untuk Monitor Toko
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Antrean Hari Ini</p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">{business.name}</h1>
        </div>

        {nowServing && (
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-8 sm:p-12 mb-6 sm:mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3 sm:mb-4">Sedang Dilayani</p>
            <div className="font-display text-7xl sm:text-9xl font-bold tracking-tighter mb-3 sm:mb-4">
              #<NumberFlip value={nowServing.queue_number ?? '—'} duration={700} />
            </div>
            <p className="text-lg sm:text-xl font-medium text-white/90">
              {nowServing.customer_name || 'Pelanggan'}
            </p>
            {nowServing.service_id && services[nowServing.service_id] && (
              <p className="text-sm text-white/70 mt-1">{services[nowServing.service_id].name}</p>
            )}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Selanjutnya</p>
          {upNext.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">Tidak ada antrean berikutnya.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {upNext.map((o, i) => (
                <div
                  key={o.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-center slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="font-display text-3xl sm:text-4xl font-bold text-white/90 mb-1">
                    #<NumberFlip value={o.queue_number ?? '—'} duration={500} />
                  </div>
                  <p className="text-xs text-white/50 truncate">{o.customer_name || 'Pelanggan'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8 text-center text-xs text-white/30 flex items-center justify-center gap-2 flex-wrap">
          <span>Update otomatis</span>
          <span>·</span>
          <LiveClock showSeconds className="text-white/30" />
          <span>·</span>
          <span suppressHydrationWarning>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
