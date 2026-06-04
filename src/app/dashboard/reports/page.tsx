'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Greeting } from '@/components/ui/greeting';
import type { Order } from '@/lib/types';

interface PeriodStats {
  revenue: number;
  orders: number;
  avgOrder: number;
}

export default function ReportsPage() {
  const { business, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user?.role !== 'OWNER') { router.push('/dashboard'); return; }
    if (!business) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
      setLoading(false);
    };
    fetch();
  }, [business, user, supabase, router]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filterPeriod = (date: Date) => {
    if (period === 'day') return date >= startOfDay;
    if (period === 'week') return date >= startOfWeek;
    return date >= startOfMonth;
  };

  const completed = orders.filter(
    (o) => o.current_status === 'completed' && filterPeriod(new Date(o.created_at))
  );
  const totalRevenue = completed.reduce((s, o) => s + o.total_price, 0);
  const pendingActive = orders.filter(
    (o) => o.current_status === 'pending' || o.current_status === 'processing'
  );
  const totalWeight = orders
    .filter((o) => o.weight_kg && filterPeriod(new Date(o.created_at)))
    .reduce((s, o) => s + (o.weight_kg || 0), 0);

  const statusCounts = {
    pending: orders.filter((o) => o.current_status === 'pending').length,
    processing: orders.filter((o) => o.current_status === 'processing').length,
    ready: orders.filter((o) => o.current_status === 'ready').length,
    completed: orders.filter((o) => o.current_status === 'completed').length,
    cancelled: orders.filter((o) => o.current_status === 'cancelled').length,
  };

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Greeting name={user?.full_name || ''} className="text-sm text-[var(--color-text-secondary)]" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
            Laporan
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Periode: {period === 'day' ? 'Hari ini' : period === 'week' ? 'Minggu ini' : 'Bulan ini'}
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-[var(--color-surface-secondary)] rounded-lg">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === p
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {{ day: 'Hari', week: 'Minggu', month: 'Bulan' }[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bento-accent p-5 slide-up" style={{ animationDelay: '60ms' }}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Pendapatan</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">
            Rp<AnimatedCounter value={Math.round(totalRevenue / 1000)} />k
          </p>
          <p className="text-xs opacity-70 mt-1">
            <AnimatedCounter value={completed.length} /> transaksi selesai
          </p>
        </div>
        <div className="bento p-5 slide-up" style={{ animationDelay: '120ms' }}>
          <p className="stat-label">Pesanan Aktif</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            <AnimatedCounter value={pendingActive.length} />
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Menunggu / Diproses</p>
        </div>
        <div className="bento p-5 slide-up" style={{ animationDelay: '180ms' }}>
          <p className="stat-label">
            {business?.business_type === 'laundry' ? 'Berat Cucian' : 'Rata-rata'}
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            {business?.business_type === 'laundry'
              ? <><AnimatedCounter value={totalWeight} decimals={1} suffix=" kg" /></>
              : `Rp${(completed.length > 0 ? totalRevenue / completed.length / 1000 : 0).toFixed(0)}k`}
          </p>
        </div>
      </div>

      <div className="bento p-4 sm:p-5">
        <h2 className="font-display font-bold text-base mb-4 text-[var(--color-text-primary)]">
          Distribusi Status
        </h2>
        <div className="space-y-3">
          {[
            { key: 'pending', label: 'Menunggu', color: 'var(--color-warning)' },
            { key: 'processing', label: 'Diproses', color: 'var(--color-accent)' },
            { key: 'ready', label: 'Siap Ambil', color: 'var(--color-success)' },
            { key: 'completed', label: 'Selesai', color: 'var(--color-text-muted)' },
            { key: 'cancelled', label: 'Dibatalkan', color: 'var(--color-danger)' },
          ].map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 text-xs font-medium text-[var(--color-text-secondary)]">
                {label}
              </span>
              <div className="flex-1 h-6 bg-[var(--color-surface-secondary)] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700 flex items-center justify-end px-2"
                  style={{
                    width: `${Math.max((statusCounts[key as keyof typeof statusCounts] / maxCount) * 100, 2)}%`,
                    backgroundColor: color,
                  }}
                >
                  {statusCounts[key as keyof typeof statusCounts] > 0 && (
                    <span className="text-[10px] font-bold text-white">
                      {statusCounts[key as keyof typeof statusCounts]}
                    </span>
                  )}
                </div>
              </div>
              <span className="w-8 text-xs text-right text-[var(--color-text-secondary)] font-bold">
                {statusCounts[key as keyof typeof statusCounts]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bento p-5">
          <h3 className="font-display font-bold text-base mb-3 text-[var(--color-text-primary)]">Ringkasan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Total pesanan</span>
              <span className="font-bold text-[var(--color-text-primary)]">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Selesai</span>
              <span className="font-bold text-[var(--color-success)]">{statusCounts.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Dibatalkan</span>
              <span className="font-bold text-[var(--color-danger)]">{statusCounts.cancelled}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)] font-semibold">Tingkat penyelesaian</span>
              <span className="font-display font-bold text-[var(--color-accent)]">
                {orders.length > 0
                  ? `${((statusCounts.completed / orders.length) * 100).toFixed(1)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
        <div className="bento p-5">
          <h3 className="font-display font-bold text-base mb-3 text-[var(--color-text-primary)]">Insight</h3>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>💡 Pesanan aktif saat ini: <strong className="text-[var(--color-text-primary)]">{pendingActive.length}</strong></p>
            <p>📅 Rata-rata order per hari: <strong className="text-[var(--color-text-primary)]">{(orders.length / 30).toFixed(1)}</strong></p>
            <p>⭐ Pelanggan loyal: <strong className="text-[var(--color-text-primary)]">{Math.floor(orders.length / 3)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
