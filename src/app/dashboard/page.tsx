'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Greeting } from '@/components/ui/greeting';
import type { Order } from '@/lib/types';

export default function DashboardPage() {
  const { business, user, loading } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    revenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!loading && business) {
      router.replace(`/dashboard/${business.business_type}`);
    }
  }, [business, loading, router]);

  useEffect(() => {
    if (!business || !user) { setStatsLoading(false); return; }

    const fetchStats = async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id);

      if (user.role === 'STAFF') {
        query = query.eq('staff_id', user.id);
      }

      const { data } = await query;
      if (data) {
        const orders = data as Order[];
        setStats({
          total: orders.length,
          pending: orders.filter((o) => o.current_status === 'pending').length,
          processing: orders.filter(
            (o) =>
              o.current_status === 'processing' ||
              o.current_status === 'weighing'
          ).length,
          completed: orders.filter(
            (o) => o.current_status === 'completed'
          ).length,
          revenue: orders
            .filter((o) => o.current_status === 'completed')
            .reduce((sum, o) => sum + o.total_price, 0),
        });
      }
      setStatsLoading(false);
    };

    fetchStats();
  }, [business, user, supabase]);

  if (loading || statsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--color-text-secondary)]">
          {user?.role === 'STAFF' || user?.role === 'CLIENT'
            ? 'Belum ada aktivitas bisnis.'
            : 'Silakan buat bisnis terlebih dahulu.'}
        </p>
      </div>
    );
  }

  const businessIcon = business.business_type === 'barbershop' ? '✂' : business.business_type === 'salon' ? '💇' : '🧺';

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="slide-up">
        <Greeting name={user?.full_name || ''} className="text-sm text-[var(--color-text-secondary)]" />
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
          Ringkasan
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Status operasional {business.name} hari ini
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bento p-4 sm:p-5 slide-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total Pesanan</p>
              <p className="stat-number text-[var(--color-text-primary)] mt-2">
                <AnimatedCounter value={stats.total} />
              </p>
            </div>
            <span className="text-2xl opacity-30 float">{businessIcon}</span>
          </div>
        </div>
        <div className="bento p-4 sm:p-5 slide-up" style={{ animationDelay: '120ms' }}>
          <p className="stat-label">Menunggu</p>
          <p className="stat-number text-[var(--color-warning)] mt-2">
            <AnimatedCounter value={stats.pending} />
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Belum diproses</p>
        </div>
        <div className="bento p-4 sm:p-5 slide-up" style={{ animationDelay: '180ms' }}>
          <p className="stat-label">Diproses</p>
          <p className="stat-number text-[var(--color-accent)] mt-2">
            <AnimatedCounter value={stats.processing} />
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Aktif berjalan</p>
        </div>
        <div className="bento-accent p-4 sm:p-5 slide-up" style={{ animationDelay: '240ms' }}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Pendapatan</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">
            Rp<AnimatedCounter value={Math.round(stats.revenue / 1000)} />k
          </p>
          <p className="text-xs opacity-70 mt-1">
            <AnimatedCounter value={stats.completed} /> selesai
          </p>
        </div>
      </div>

      <div className="bento p-6 sm:p-8 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {user?.role === 'OWNER'
            ? 'Menu spesifik bisnis tersedia di sidebar. Gunakan navigasi untuk mengelola pesanan, layanan, dan staf.'
            : 'Menu operasional tersedia di sidebar.'}
        </p>
      </div>
    </div>
  );
}
