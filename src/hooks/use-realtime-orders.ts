'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { Order } from '@/lib/types';

type OrderAction = 'INSERT' | 'UPDATE' | 'DELETE';

export function useRealtimeOrders(
  businessId: string | undefined,
  onPayload: (action: OrderAction, order: Order) => void
) {
  const supabase = createClient();
  const callbackRef = useRef(onPayload);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    if (!businessId) return;
    cancelledRef.current = false;

    const setupChannel = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`orders:${businessId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload: { eventType: string; new: Order | null; old: Order | null }) => {
            callbackRef.current(
              payload.eventType as OrderAction,
              (payload.new ?? payload.old) as Order
            );
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setTimeout(() => {
              if (businessId && !cancelledRef.current) setupChannel();
            }, 1500);
          }
        });

      channelRef.current = channel;
    };

    setupChannel();

    let visibilityTimer: ReturnType<typeof setTimeout> | null = null;
    const onVisibilityChange = () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => {
        if (document.visibilityState === 'visible' && businessId && !cancelledRef.current) {
          setupChannel();
        }
      }, 800);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelledRef.current = true;
      if (visibilityTimer) clearTimeout(visibilityTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [businessId, supabase]);
}
