'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import type { Order, User } from '@/lib/types';

interface CustomerSummary {
  user: Pick<User, 'id' | 'full_name' | 'email'>;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  orders: Order[];
}

export default function CustomersPage() {
  const { business, user } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!business) { setLoading(false); return; }
    if (user?.role !== 'OWNER') return;

    const fetch = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (!orders) { setLoading(false); return; }

      const clientIds = [...new Set(orders.map((o: Order) => o.client_id))];
      if (clientIds.length === 0) { setLoading(false); return; }

      const { data: clients } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', clientIds);

      if (!clients) { setLoading(false); return; }

      const summary = clients.map((c: any) => {
        const customerOrders = orders.filter((o: Order) => o.client_id === c.id);
        return {
          user: c as Pick<User, 'id' | 'full_name' | 'email'>,
          totalOrders: customerOrders.length,
          totalSpent: customerOrders.reduce((s: number, o: Order) => s + o.total_price, 0),
          lastVisit: customerOrders[0]?.created_at || '',
          orders: customerOrders,
        };
      });

      summary.sort((a: { totalOrders: number }, b: { totalOrders: number }) => b.totalOrders - a.totalOrders);
      setCustomers(summary);
      setLoading(false);
    };

    fetch();
  }, [business, user, supabase]);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.user.full_name.toLowerCase().includes(q) ||
        c.user.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl mx-auto">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="h-10 skeleton-pulse rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 skeleton-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (user?.role !== 'OWNER') return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Pelanggan
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          {customers.length} pelanggan terdaftar
        </p>
      </div>

      <input
        type="text"
        placeholder="Cari pelanggan..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />

      {filtered.length === 0 ? (
        <div className="bento p-8 sm:p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {customers.length === 0
              ? 'Belum ada pelanggan.'
              : 'Tidak ada hasil yang cocok.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((c, i) => (
            <button
              key={c.user.id}
              onClick={() => setSelectedCustomer(selectedCustomer?.user.id === c.user.id ? null : c)}
              className="bento p-4 text-left hover:border-[var(--color-accent)] transition-all slide-up text-left"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] font-bold shrink-0">
                  {c.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                    {c.user.full_name}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {c.user.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-base text-[var(--color-accent)]">
                    {c.totalOrders}x
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                    order
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">Total belanja</span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  Rp{c.totalSpent.toLocaleString('id-ID')}
                </span>
              </div>

              {selectedCustomer?.user.id === c.user.id && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)] slide-down">
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
                    Riwayat Pesanan
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {c.orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-1.5 px-2 bg-[var(--color-surface-secondary)] rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              order.current_status === 'completed'
                                ? 'bg-[var(--color-success)]'
                                : order.current_status === 'cancelled'
                                  ? 'bg-[var(--color-danger)]'
                                  : 'bg-[var(--color-warning)]'
                            }`}
                          />
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Rp{order.total_price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="text-[var(--color-text-muted)]">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
