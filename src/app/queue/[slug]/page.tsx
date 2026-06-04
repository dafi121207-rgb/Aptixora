'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { NumberFlip } from '@/components/ui/number-flip';
import { LiveClock } from '@/components/ui/live-clock';
import type { Order, Business, Service } from '@/lib/types';

export default function QueuePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchBusiness = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('queue_slug', slug)
        .eq('queue_enabled', true)
        .single();
      if (data) setBusiness(data as Business);
      setLoading(false);
    };
    fetchBusiness();
  }, [slug, supabase]);

  useEffect(() => {
    if (!business) return;
    const fetch = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [ordersRes, servicesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .is('deleted_at', null)
          .gte('created_at', todayStart.toISOString())
          .in('current_status', ['pending', 'weighing', 'processing', 'ready'])
          .order('queue_number', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .eq('business_id', business.id),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (servicesRes.data) {
        const map: Record<string, Service> = {};
        (servicesRes.data as Service[]).forEach((s) => (map[s.id] = s));
        setServices(map);
      }
    };
    fetch();
  }, [business, supabase]);

  useEffect(() => {
    if (!business) return;
    const channel = supabase
      .channel(`queue-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
        () => {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          supabase
            .from('orders')
            .select('*')
            .eq('business_id', business.id)
            .is('deleted_at', null)
            .gte('created_at', todayStart.toISOString())
            .in('current_status', ['pending', 'weighing', 'processing', 'ready'])
            .order('queue_number', { ascending: true })
            .then(({ data }) => data && setOrders(data as Order[]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [business, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1825] flex items-center justify-center">
        <div className="text-white/40 text-sm">Memuat antrean...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#0c1825] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-xl font-display mb-2">Antrean tidak ditemukan</p>
          <p className="text-white/40 text-sm">Bisnis ini belum mengaktifkan tampilan antrean publik.</p>
        </div>
      </div>
    );
  }

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
          <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
