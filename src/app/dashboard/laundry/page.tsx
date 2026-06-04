'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';
import { useToast } from '@/context/toast-context';
import { Greeting } from '@/components/ui/greeting';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import type { Order, Service } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface KanbanColumn {
  id: string;
  title: string;
  orders: Order[];
}

const columnConfig: { id: Order['current_status']; title: string; short: string }[] = [
  { id: 'pending', title: 'Masuk', short: 'Masuk' },
  { id: 'weighing', title: 'Timbang', short: 'Timbang' },
  { id: 'processing', title: 'Diproses', short: 'Proses' },
  { id: 'ready', title: 'Siap Ambil', short: 'Siap' },
  { id: 'completed', title: 'Selesai', short: 'Selesai' },
];

export default function LaundryDashboard() {
  const { business, user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>(
    columnConfig.map((c) => ({ ...c, orders: [] }))
  );
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [inputService, setInputService] = useState('');
  const [inputWeight, setInputWeight] = useState('');
  const [inputClient, setInputClient] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [weighingOrder, setWeighingOrder] = useState<Order | null>(null);
  const [weighWeight, setWeighWeight] = useState('');
  const [weighingSubmit, setWeighingSubmit] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const isOwner = user?.role === 'OWNER';
  const isStaff = user?.role === 'STAFF';

  const fetchOrders = useCallback(async () => {
    if (!business) { setLoading(false); return; }

    const [ordersRes, servicesRes] = await Promise.all([
      (() => {
        let q = supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .not('current_status', 'in', '("cancelled")')
          .order('created_at', { ascending: true });
        if (isStaff) q = q.eq('staff_id', user.id);
        return q;
      })(),
      supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .order('name'),
    ]);

    if (servicesRes.data) setServices(servicesRes.data as Service[]);

    const data = ordersRes.data;
    if (!data) { setLoading(false); return; }

    const grouped = columnConfig.map((col) => ({
      ...col,
      orders: (data as Order[]).filter((o) => o.current_status === col.id),
    }));

    setColumns(grouped);
    setLoading(false);
  }, [business, supabase, isStaff, user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useRealtimeOrders(business?.id, useCallback(() => {
    fetchOrders();
  }, [fetchOrders]));

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColIdx = columns.findIndex((c) => c.id === source.droppableId);
    const destColIdx = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIdx === -1 || destColIdx === -1) return;

    const newColumns = columns.map((col) => ({ ...col, orders: [...col.orders] }));
    const [moved] = newColumns[sourceColIdx].orders.splice(source.index, 1);
    newColumns[destColIdx].orders.splice(destination.index, 0, moved);

    setColumns(newColumns);

    const newStatus = newColumns[destColIdx].id as Order['current_status'];
    const { error } = await supabase
      .from('orders')
      .update({ current_status: newStatus })
      .eq('id', moved.id);

    if (error) {
      fetchOrders();
    } else {
      toast(`Nota #${moved.queue_number || moved.id.slice(0, 4)} → ${columnConfig[destColIdx].title}`, 'success');
    }
  };

  const handleNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user) return;
    if (!inputService) { toast('Pilih layanan', 'error'); return; }
    setSubmitting(true);

    const service = services.find((s) => s.id === inputService);
    const w = parseFloat(inputWeight) || 0;
    const manualPrice = parseFloat(inputPrice) || 0;
    const computedPrice =
      service && service.unit_type === 'kg' && w > 0
        ? service.price * w
        : manualPrice;

    const { data: queueData } = await supabase.rpc('next_queue_number', {
      p_business_id: business.id,
    });
    const queueNumber = (typeof queueData === 'number' ? queueData : null) ?? null;

    const { error } = await supabase.from('orders').insert({
      business_id: business.id,
      client_id: user.id,
      service_id: inputService || null,
      total_price: computedPrice,
      weight_kg: w || null,
      current_status: 'weighing',
      notes: inputClient || null,
      customer_name: inputClient || null,
      queue_number: queueNumber,
    });

    if (error) {
      toast(error.message, 'error');
      setSubmitting(false);
      return;
    }

    toast(`Nota #${queueNumber} berhasil dibuat`, 'success');
    setShowInput(false);
    setInputService('');
    setInputWeight('');
    setInputClient('');
    setInputPrice('');
    setSubmitting(false);
    fetchOrders();
  };

  const handleWeighing = async () => {
    if (!weighingOrder) return;
    const w = parseFloat(weighWeight);
    if (isNaN(w) || w <= 0) {
      toast('Masukkan berat yang valid', 'error');
      return;
    }
    setWeighingSubmit(true);

    const service = weighingOrder.service_id
      ? services.find((s) => s.id === weighingOrder.service_id)
      : null;

    const totalPrice =
      service && service.unit_type === 'kg'
        ? service.price * w
        : weighingOrder.total_price || 0;

    const { error } = await supabase
      .from('orders')
      .update({
        weight_kg: w,
        total_price: totalPrice,
        current_status: 'weighing',
      })
      .eq('id', weighingOrder.id);

    setWeighingSubmit(false);
    if (error) {
      toast('Gagal: ' + error.message, 'error');
      return;
    }

    toast(
      `Berat ${w}kg · Total Rp${totalPrice.toLocaleString('id-ID')}`,
      'success'
    );
    setWeighingOrder(null);
    setWeighWeight('');
    fetchOrders();
  };

  const updateWeightInline = async (orderId: string, weight: string) => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    const order = columns.flatMap((c) => c.orders).find((o) => o.id === orderId);
    if (!order) return;

    const service = order.service_id
      ? services.find((s) => s.id === order.service_id)
      : null;
    const totalPrice =
      service && service.unit_type === 'kg'
        ? service.price * w
        : order.total_price || 0;

    const { error } = await supabase
      .from('orders')
      .update({ weight_kg: w, total_price: totalPrice })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
      toast(
        `Berat ${w}kg · Rp${totalPrice.toLocaleString('id-ID')}`,
        'success'
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 skeleton-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalWeight = columns
    .flatMap((c) => c.orders)
    .reduce((sum, o) => sum + (o.weight_kg || 0), 0);

  const activeNotes = columns
    .slice(0, 3)
    .flatMap((c) => c.orders).length;

  const weighingService = weighingOrder?.service_id
    ? services.find((s) => s.id === weighingOrder.service_id)
    : null;
  const weighedTotal =
    weighingService && weighingService.unit_type === 'kg' && parseFloat(weighWeight) > 0
      ? weighingService.price * parseFloat(weighWeight)
      : weighingOrder?.total_price || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Greeting name={user?.full_name || ''} className="text-sm text-[var(--color-text-secondary)]" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
            Dashboard Laundry
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Drag nota untuk ubah status · Timbang dulu nota baru
          </p>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="btn btn-primary shrink-0"
        >
          {showInput ? 'Batal' : '+ Nota'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bento p-4 sm:p-5 slide-up" style={{ animationDelay: '60ms' }}>
          <p className="stat-label">Total Berat</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            <AnimatedCounter value={totalWeight} decimals={1} /><span className="text-base text-[var(--color-text-secondary)] ml-1">kg</span>
          </p>
        </div>
        <div className="bento p-4 sm:p-5 slide-up" style={{ animationDelay: '120ms' }}>
          <p className="stat-label">Nota Aktif</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            <AnimatedCounter value={activeNotes} />
          </p>
        </div>
        <div className="bento-accent p-4 sm:p-5 slide-up" style={{ animationDelay: '180ms' }}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Siap Ambil</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">
            <AnimatedCounter value={columns[3].orders.length} />
          </p>
        </div>
      </div>

      {showInput && (
        <form onSubmit={handleNewOrder} className="bento p-4 sm:p-5 space-y-3 slide-down">
          <h2 className="font-display font-bold text-base text-[var(--color-text-primary)]">
            Nota Baru (Walk-in)
          </h2>
          <div>
            <label className="label">Pilih Layanan</label>
            <select
              required
              value={inputService}
              onChange={(e) => setInputService(e.target.value)}
              className="input-field"
            >
              <option value="">— Pilih layanan —</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — Rp{svc.price.toLocaleString('id-ID')}
                  {svc.unit_type === 'kg' ? '/kg' : svc.unit_type ? `/${svc.unit_type}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Pelanggan</label>
              <input
                type="text"
                required
                placeholder="cth: Budi"
                value={inputClient}
                onChange={(e) => setInputClient(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Berat (kg, opsional)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="label">Harga (otomatis dari layanan/kg, atau isi manual)</label>
            <input
              type="number"
              step="100"
              placeholder="0"
              value={inputPrice}
              onChange={(e) => setInputPrice(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full sm:w-auto"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Nota'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="grid grid-cols-5 gap-2 sm:gap-3 items-start"
            style={{ minWidth: '760px' }}
          >
            {columns.map((col) => (
              <div
                key={col.id}
                className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border)] flex flex-col self-start"
              >
                <div className="p-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
                  <p className="font-display font-bold text-[11px] uppercase tracking-wider text-[var(--color-text-primary)] truncate">
                    {col.title}
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] px-1.5 py-0.5 rounded shrink-0 ml-1">
                    {col.orders.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-1.5 space-y-1.5 max-h-[420px] overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[var(--color-accent-light)]' : ''
                      }`}
                    >
                      {col.orders.length === 0 && (
                        <div className="text-[10px] text-[var(--color-text-muted)] text-center py-6">
                          Kosong
                        </div>
                      )}
                      {col.orders.map((order, index) => {
                        const service = order.service_id
                          ? services.find((s) => s.id === order.service_id)
                          : null;
                        const needsWeighing = col.id === 'pending' && !order.weight_kg;
                        return (
                          <Draggable
                            key={order.id}
                            draggableId={order.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 bg-[var(--color-surface-elevated)] rounded-md border text-xs transition-shadow ${
                                  snapshot.isDragging
                                    ? 'shadow-lg border-[var(--color-accent)]'
                                    : 'border-[var(--color-border)]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="font-display font-bold text-sm text-[var(--color-text-primary)]">
                                    #{order.queue_number || order.id.slice(0, 4)}
                                  </span>
                                  {order.weight_kg ? (
                                    <span className="font-semibold text-[var(--color-accent)] text-[10px]">
                                      {order.weight_kg}kg
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[var(--color-warning)] font-semibold">
                                      belum
                                    </span>
                                  )}
                                </div>
                                <p className="font-medium text-[var(--color-text-primary)] truncate text-[11px]">
                                  {order.customer_name || order.notes || `Nota ${order.id.slice(0, 4)}`}
                                </p>
                                {service && (
                                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                                    {service.name}
                                  </p>
                                )}
                                <p className="text-[var(--color-text-secondary)] mt-0.5 text-[10px] font-semibold">
                                  {order.total_price > 0
                                    ? `Rp${order.total_price.toLocaleString('id-ID')}`
                                    : '⏳ belum ditimbang'}
                                </p>
                                {needsWeighing && isOwner && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWeighingOrder(order);
                                      setWeighWeight('');
                                    }}
                                    className="w-full mt-1.5 px-2 py-1 bg-[var(--color-accent)] text-white text-[10px] font-semibold rounded hover:opacity-90 transition-opacity"
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    ⚖ Timbang
                                  </button>
                                )}
                                {col.id === 'weighing' && isOwner && (
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Update kg"
                                    defaultValue={order.weight_kg || ''}
                                    onBlur={(e) => {
                                      if (e.target.value && parseFloat(e.target.value) !== order.weight_kg) {
                                        updateWeightInline(order.id, e.target.value);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    }}
                                    className="w-full mt-1.5 px-2 py-1 border border-[var(--color-border)] rounded text-[10px] bg-[var(--color-surface-elevated)]"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {weighingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 fade-in"
          onClick={() => !weighingSubmit && setWeighingOrder(null)}
        >
          <div
            className="bg-[var(--color-surface-elevated)] rounded-2xl max-w-sm w-full p-5 shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-2xl">
                ⚖
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                  Nota #{weighingOrder.queue_number || weighingOrder.id.slice(0, 4)}
                </p>
                <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                  Timbang Cucian
                </h3>
              </div>
            </div>

            <div className="bento p-3 mb-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">Pelanggan</p>
              <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                {weighingOrder.customer_name || weighingOrder.notes || '—'}
              </p>
              {weighingService && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Layanan: {weighingService.name} · Rp{weighingService.price.toLocaleString('id-ID')}
                  {weighingService.unit_type === 'kg' ? '/kg' : ''}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Berat (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                autoFocus
                value={weighWeight}
                onChange={(e) => setWeighWeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleWeighing();
                  }
                }}
                placeholder="cth: 3.5"
                className="input-field text-2xl font-display font-bold text-center"
              />
            </div>

            {weighWeight && parseFloat(weighWeight) > 0 && (
              <div className="bento-accent p-3 mb-4 text-center">
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  Total Harga
                </p>
                <p className="font-display text-2xl font-bold mt-0.5">
                  Rp{weighedTotal.toLocaleString('id-ID')}
                </p>
                {weighingService?.unit_type === 'kg' && (
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {parseFloat(weighWeight)} kg × Rp{weighingService.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setWeighingOrder(null)}
                disabled={weighingSubmit}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleWeighing}
                disabled={weighingSubmit || !weighWeight}
                className="btn btn-primary flex-1"
              >
                {weighingSubmit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
