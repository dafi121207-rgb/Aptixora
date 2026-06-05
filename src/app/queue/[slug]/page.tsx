import { createClient } from '@/lib/supabase-server';
import { QueueDisplay } from './queue-display';
import { notFound } from 'next/navigation';
import type { Order, Business, Service } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QueuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('queue_slug', slug)
    .eq('queue_enabled', true)
    .single<Business>();

  if (!business) notFound();

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

  const initialOrders = (ordersRes.data ?? []) as Order[];
  const servicesMap: Record<string, Service> = {};
  ((servicesRes.data ?? []) as Service[]).forEach((s) => (servicesMap[s.id] = s));

  return (
    <QueueDisplay
      business={business}
      initialOrders={initialOrders}
      initialServices={servicesMap}
    />
  );
}
