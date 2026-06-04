'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { AptixoraLogo } from '@/components/aptixora-logo';
import { Confetti } from '@/components/ui/confetti';
import { serviceColor } from '@/components/ui/service-color';
import { slotToISO } from '@/lib/datetime';
import type { Business, Service, User, Order } from '@/lib/types';

const businessIcons: Record<string, string> = {
  barbershop: '✂',
  salon: '💇',
  laundry: '🧺',
};

export default function BookBusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [customerName, setCustomerName] = useState(() => user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [bookingTime, setBookingTime] = useState('09:00');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [bizRes, svcRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase.from('services').select('*').eq('business_id', businessId),
    ]);

    if (bizRes.data) setBusiness(bizRes.data as Business);
    if (svcRes.data) setServices(svcRes.data as Service[]);

    if (bizRes.data?.business_type !== 'laundry') {
      const [orderStaffRes, sbStaffRes] = await Promise.all([
        supabase
          .from('orders')
          .select('staff_id, users!staff_id(full_name, id)')
          .eq('business_id', businessId)
          .not('staff_id', 'is', null),
        supabase
          .from('staff_business')
          .select('user_id, users!user_id(full_name, id)')
          .eq('business_id', businessId),
      ]);

      const staffMap = new Map<string, User>();
      orderStaffRes.data?.forEach((o: any) => {
        if (o.users && !staffMap.has(o.users.id))
          staffMap.set(o.users.id, o.users as User);
      });
      sbStaffRes.data?.forEach((s: any) => {
        if (s.users && !staffMap.has(s.users.id))
          staffMap.set(s.users.id, s.users as User);
      });
      setStaff(Array.from(staffMap.values()));
    }

    setLoading(false);
  }, [businessId, supabase, user?.full_name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business) {
      setError('Silakan masuk terlebih dahulu');
      return;
    }
    if (!selectedService) {
      setError('Pilih layanan');
      return;
    }

    setError(null);
    setSubmitting(true);

    const svc = services.find((s) => s.id === selectedService);
    const bookingSlot =
      business.business_type !== 'laundry'
        ? slotToISO(bookingDate, bookingTime)
        : null;

    if (bookingSlot && selectedStaff) {
      const { data: clash } = await supabase
        .from('orders')
        .select('id')
        .eq('business_id', business.id)
        .eq('staff_id', selectedStaff)
        .eq('booking_slot', bookingSlot)
        .not('current_status', 'eq', 'cancelled');

      if (clash && clash.length > 0) {
        setError('Slot sudah dibooking. Pilih waktu atau staf lain.');
        setSubmitting(false);
        return;
      }
    }

    const { data: queueData } = await supabase.rpc('next_queue_number', {
      p_business_id: business.id,
    });
    const qNum = (typeof queueData === 'number' ? queueData : null) ?? null;

    const { error: insertError } = await supabase.from('orders').insert({
      business_id: business.id,
      client_id: user.id,
      service_id: selectedService || null,
      staff_id: selectedStaff || null,
      total_price: svc?.price ?? 0,
      current_status: 'pending',
      booking_slot: bookingSlot,
      customer_name: customerName || null,
      queue_number: qNum,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setQueueNumber(qNum);
    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-sm text-[var(--color-text-muted)]">Memuat...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">Bisnis tidak ditemukan.</p>
          <button onClick={() => router.push('/book')} className="btn btn-primary">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4 relative overflow-hidden">
        <Confetti active={success} count={80} />
        <div className="max-w-sm w-full text-center slide-up relative z-10">
          <div className="w-20 h-20 bg-[var(--color-success-light)] rounded-2xl flex items-center justify-center mx-auto mb-5 bounce-once">
            <span className="text-4xl">✓</span>
          </div>
          {queueNumber !== null && (
            <div className="bento-accent p-4 mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Nomor Antrean Anda</p>
              <p className="font-display text-5xl font-bold mt-1">#{queueNumber}</p>
            </div>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">
            Booking Berhasil!
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Pesanan Anda telah tercatat di <strong>{business.name}</strong>.{' '}
            {business.business_type === 'laundry'
              ? 'Bawa cucian ke toko untuk ditimbang, harga akan dihitung berdasarkan berat aktual.'
              : 'Pantau status real-time di halaman Lacak.'}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/track')}
              className="btn btn-primary w-full"
            >
              Lacak Pesanan
            </button>
            <button
              onClick={() => router.push('/book')}
              className="btn btn-secondary w-full"
            >
              Booking Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLaundry = business.business_type === 'laundry';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/book" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AptixoraLogo size={24} />
            <span className="font-display font-bold text-sm text-[var(--color-text-primary)]">Aptixora</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            <Link href="/track" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Lacak</Link>
            <Link href="/bookings" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Pesanan</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
        <button
          onClick={() => router.push('/book')}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-3"
        >
          ← Kembali ke daftar bisnis
        </button>

        <div className="bento p-4 mb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-3xl shrink-0">
            {businessIcons[business.business_type]}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-[var(--color-text-primary)]">
              {business.name}
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] capitalize">
              {business.business_type}
            </p>
          </div>
        </div>

        {!user && (
          <div className="bento p-3 mb-4 text-sm bg-[var(--color-warning-light)] border-[var(--color-warning)]">
            <span className="text-[var(--color-warning)] font-semibold">Silakan </span>
            <button onClick={() => router.push('/auth/login')} className="text-[var(--color-accent)] font-semibold hover:underline">masuk</button>
            <span className="text-[var(--color-warning)]"> atau </span>
            <button onClick={() => router.push('/auth/register')} className="text-[var(--color-accent)] font-semibold hover:underline">daftar</button>
            <span className="text-[var(--color-warning)]"> untuk booking.</span>
          </div>
        )}

        <form onSubmit={handleBook} className="bento p-4 sm:p-5 space-y-3">
          <div>
            <label className="label">Pilih Layanan</label>
            <select
              required
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input-field"
            >
              <option value="">— Pilih —</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — Rp{svc.price.toLocaleString('id-ID')}
                  {svc.duration_minutes && ` (${svc.duration_minutes}m)`}
                  {svc.unit_type && svc.unit_type !== 'sesi' ? ` /${svc.unit_type}` : ''}
                </option>
              ))}
            </select>
            {selectedService && (() => {
              const svc = services.find((s) => s.id === selectedService);
              if (!svc) return null;
              const c = serviceColor(svc.name);
              return (
                <div className="mt-2 flex items-center gap-2 slide-down">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{ backgroundColor: c.bg, color: c.text, borderLeft: `3px solid ${c.border}` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.border }} />
                    {svc.name}
                  </span>
                  {svc.unit_type && svc.unit_type !== 'sesi' && (
                    <span className="text-xs text-[var(--color-text-muted)]">× {svc.unit_type}</span>
                  )}
                </div>
              );
            })()}
          </div>

          <div>
            <label className="label">Nama Pelanggan</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="cth: Siti Aminah"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">No. HP / WhatsApp (opsional)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08xxx"
              className="input-field"
            />
          </div>

          {!isLaundry && staff.length > 0 && (
            <div>
              <label className="label">Pilih Staf (opsional)</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="input-field"
              >
                <option value="">— Pilih Staf —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {!isLaundry && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Jam</label>
                <input
                  type="time"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !user}
            className="btn btn-primary w-full active:scale-[0.97]"
          >
            {submitting ? 'Memproses...' : isLaundry ? 'Buat Nota Cucian' : 'Booking Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
