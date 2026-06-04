'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';
import { useToast } from '@/context/toast-context';
import { OrderBadge } from '@/components/ui/order-badge';
import { OrderDetail } from '@/components/ui/order-detail';
import { Avatar } from '@/components/ui/avatar';
import { RelativeTime } from '@/components/ui/relative-time';
import { serviceColor } from '@/components/ui/service-color';
import { formatSlotDateTime } from '@/lib/datetime';
import type { Order } from '@/lib/types';

type StatusFilter = 'all' | 'pending' | 'weighing' | 'processing' | 'ready' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const { business, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const supabase = createClient();
  const { toast } = useToast();
  const isOwner = user?.role === 'OWNER';
  const isStaff = user?.role === 'STAFF';

  const fetchOrders = useCallback(async () => {
    if (!business || !user) { setLoading(false); return; }

    let query = supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (isStaff) query = query.eq('staff_id', user.id);

    const { data } = await query;
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [business, user, supabase, isStaff]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useRealtimeOrders(business?.id, fetchOrders);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ current_status: status })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, current_status: status as Order['current_status'] }
            : o
        )
      );
      toast('Status pesanan diperbarui', 'success');
    }
  };

  const handleDelete = async (order: Order) => {
    if (!['completed', 'cancelled'].includes(order.current_status)) {
      toast('Hanya pesanan selesai / dibatalkan yang bisa dihapus permanen', 'error');
      return;
    }
    if (!confirm(
      `Hapus PERMANEN pesanan #${order.queue_number ?? '—'} dari ${order.customer_name || 'pelanggan'}?\n\nData yang dihapus tidak bisa dikembalikan.`
    )) return;

    setDeletingId(order.id);
    const { error } = await supabase.rpc('hard_delete_order', { p_order_id: order.id });

    setDeletingId(null);
    if (error) {
      toast('Gagal menghapus: ' + error.message, 'error');
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    toast('Pesanan dihapus permanen dari database', 'success');
  };

  const handleBulkDelete = async () => {
    if (!business) return;
    const targetCount = orders.filter((o) => ['completed', 'cancelled'].includes(o.current_status)).length;
    if (targetCount === 0) {
      toast('Tidak ada pesanan selesai/dibatalkan untuk dihapus', 'info');
      return;
    }
    if (!confirm(
      `Hapus PERMANEN ${targetCount} pesanan selesai/dibatalkan dari database?\n\nTindakan ini membebaskan storage di Supabase. Tidak bisa dibatalkan.`
    )) return;

    setBulkDeleting(true);
    const { data, error } = await supabase.rpc('bulk_delete_completed_orders', {
      p_business_id: business.id,
    });
    setBulkDeleting(false);

    if (error) {
      toast('Gagal: ' + error.message, 'error');
      return;
    }
    toast(`${data} pesanan dihapus permanen · Storage berkurang`, 'success');
    fetchOrders();
  };

  const handleAutoPurge = async () => {
    if (!business) return;
    setBulkDeleting(true);
    const { data, error } = await supabase.rpc('purge_old_orders', {
      p_business_id: business.id,
      p_days_old: purgeDays,
    });
    setBulkDeleting(false);
    setShowPurgeModal(false);

    if (error) {
      toast('Gagal: ' + error.message, 'error');
      return;
    }
    if (data === 0) {
      toast(`Tidak ada pesanan >${purgeDays} hari yang bisa dihapus`, 'info');
      return;
    }
    toast(`${data} pesanan lama dihapus permanen`, 'success');
    fetchOrders();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        (o.notes || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.queue_number?.toString() || '').includes(search);
      const matchStatus =
        filterStatus === 'all' || o.current_status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const completedCount = orders.filter((o) => ['completed', 'cancelled'].includes(o.current_status)).length;
  const completedShown = filteredOrders.filter((o) => ['completed', 'cancelled'].includes(o.current_status)).length;

  if (loading) {
    return (
      <div className="space-y-3 max-w-5xl mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 skeleton-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Pesanan
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {orders.length} pesanan · Update real-time
          </p>
        </div>

        {isOwner && completedCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="btn btn-secondary text-xs"
              title={`Hapus permanen ${completedCount} pesanan selesai/dibatalkan`}
            >
              {bulkDeleting ? 'Menghapus...' : `🗑 Bersihkan ${completedCount} Selesai`}
            </button>
            <button
              onClick={() => setShowPurgeModal(true)}
              disabled={bulkDeleting}
              className="btn btn-secondary text-xs"
              title="Hapus pesanan lama otomatis"
            >
              ⏰ Auto-Purge
            </button>
          </div>
        )}
      </div>

      <div className="bento p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Cari pesanan, nama, atau nomor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
          className="input-field sm:w-48"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          {business?.business_type === 'laundry' && <option value="weighing">Ditimbang</option>}
          <option value="processing">Diproses</option>
          {business?.business_type === 'laundry' && <option value="ready">Siap Ambil</option>}
          <option value="completed">Selesai ({orders.filter((o) => o.current_status === 'completed').length})</option>
          <option value="cancelled">Dibatalkan ({orders.filter((o) => o.current_status === 'cancelled').length})</option>
        </select>
      </div>

      {isOwner && completedCount > 5 && (
        <div className="bento p-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-warning-light)] border-[var(--color-warning)] flex items-center gap-2">
          <span>💡</span>
          <span>
            Ada <strong>{completedCount}</strong> pesanan selesai/dibatalkan. Hapus permanen untuk hemat storage Supabase free plan.
          </span>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bento p-8 sm:p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {orders.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada hasil yang cocok.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredOrders.map((order, i) => {
            const canDelete = ['completed', 'cancelled'].includes(order.current_status) && (isOwner || isStaff);
            return (
              <div
                key={order.id}
                className="bento p-3 sm:p-4 flex items-start gap-3 slide-up"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <Avatar
                  name={order.customer_name || order.notes || 'Tanpa nama'}
                  size={36}
                  className="mt-0.5"
                />
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {order.queue_number !== null && (
                      <span
                        className="font-display font-bold text-sm px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: serviceColor(order.customer_name || 'Pelanggan').bg,
                          color: serviceColor(order.customer_name || 'Pelanggan').text,
                        }}
                      >
                        #{order.queue_number}
                      </span>
                    )}
                    <OrderBadge status={order.current_status} />
                  </div>
                  <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                    {order.customer_name || order.notes || 'Tanpa nama'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      Rp{order.total_price.toLocaleString('id-ID')}
                    </span>
                    {order.weight_kg && <span>· {order.weight_kg} kg</span>}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                    <RelativeTime iso={order.created_at} />
                    {order.booking_slot && (
                      <>
                        <span>·</span>
                        <span>{formatSlotDateTime(order.booking_slot)}</span>
                      </>
                    )}
                  </p>
                </button>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {(isOwner || isStaff) &&
                    order.current_status !== 'completed' &&
                    order.current_status !== 'cancelled' && (
                      <select
                        value={order.current_status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="px-2 py-1.5 text-[10px] font-semibold border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]"
                      >
                        <option value="pending">Menunggu</option>
                        {business?.business_type === 'laundry' && <option value="weighing">Timbang</option>}
                        <option value="processing">Proses</option>
                        {business?.business_type === 'laundry' && <option value="ready">Siap</option>}
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Batal</option>
                      </select>
                    )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(order)}
                      disabled={deletingId === order.id}
                      className="px-2 py-1.5 text-[10px] font-semibold border border-[var(--color-danger)] text-[var(--color-danger)] rounded-lg hover:bg-[var(--color-danger-light)] disabled:opacity-50 transition-colors"
                      title="Hapus permanen dari database"
                    >
                      {deletingId === order.id ? '...' : '🗑 Hapus'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {showPurgeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 fade-in"
          onClick={() => !bulkDeleting && setShowPurgeModal(false)}
        >
          <div
            className="bg-[var(--color-surface-elevated)] rounded-2xl max-w-sm w-full p-5 shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center text-xl">
                ⏰
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                Auto-Purge Pesanan Lama
              </h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Hapus permanen semua pesanan <strong>selesai / dibatalkan</strong> yang lebih lama dari:
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPurgeDays(d)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                    purgeDays === d
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)]'
                  }`}
                >
                  {d} hari
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              💡 Disarankan: <strong>30 hari</strong>. Pesanan aktif & berjalan tidak akan dihapus.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                disabled={bulkDeleting}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleAutoPurge}
                disabled={bulkDeleting}
                className="btn btn-primary flex-1"
              >
                {bulkDeleting ? 'Menghapus...' : `Hapus >${purgeDays} hari`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
