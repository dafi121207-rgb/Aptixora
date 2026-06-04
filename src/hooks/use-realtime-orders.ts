'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { Order } from '@/lib/types';

type OrderAction = 'INSERT' | 'UPDATE' | 'DELETE';

export function useRealtimeOrders(
  businessId: string | undefined,
  onPayload: (action: OrderAction, order: Order) => void
) {
  const supabase = useRef(createClient());

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase.current
      .channel(`orders:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          onPayload(
            payload.eventType as OrderAction,
            payload.new as Order
          );
        }
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [businessId, onPayload]);
}
