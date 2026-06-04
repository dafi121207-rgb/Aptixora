'use client';

import type { Order } from '@/lib/types';
import { OrderBadge } from './order-badge';

interface OrderDetailProps {
  order: Order;
  onClose: () => void;
}

const statusTimeline: Record<string, { label: string; desc: string }> = {
  pending: { label: 'Dibuat', desc: 'Pesanan masuk ke sistem' },
  weighing: { label: 'Ditimbang', desc: 'Berat cucian dicatat' },
  processing: { label: 'Diproses', desc: 'Layanan sedang dikerjakan' },
  ready: { label: 'Siap', desc: 'Pesanan siap diambil' },
  completed: { label: 'Selesai', desc: 'Pesanan selesai' },
};

export function OrderDetail({ order, onClose }: OrderDetailProps) {
  const statusKeys = order.weight_kg
    ? ['pending', 'weighing', 'processing', 'ready', 'completed']
    : ['pending', 'processing', 'completed'];

  const currentIdx = statusKeys.indexOf(order.current_status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md mx-4 w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            Detail Pesanan
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">Status</span>
            <OrderBadge status={order.current_status} />
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Total</span>
            <span className="font-medium">
              Rp{order.total_price.toLocaleString('id-ID')}
            </span>
          </div>

          {order.weight_kg && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Berat</span>
              <span>{order.weight_kg} kg</span>
            </div>
          )}

          {order.booking_slot && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Jam</span>
              <span>
                {new Date(order.booking_slot).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {order.notes && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Catatan</span>
              <span>{order.notes}</span>
            </div>
          )}

          <hr className="border-[var(--color-border)]" />

          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
              Timeline
            </p>
            <div className="space-y-3">
              {statusKeys.map((key, i) => {
                const step = statusTimeline[key];
                const done = i <= currentIdx;
                const isLast = i === statusKeys.length - 1;

                return (
                  <div key={key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1 ${
                          done
                            ? 'bg-[var(--color-accent)]'
                            : 'bg-[var(--color-border)]'
                        }`}
                      />
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[16px] ${
                            done && i < currentIdx
                              ? 'bg-[var(--color-accent)]'
                              : 'bg-[var(--color-border)]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p
                        className={`text-xs font-medium ${
                          done
                            ? 'text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {step?.label}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        {step?.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
