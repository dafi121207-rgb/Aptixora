'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { AptixoraLogo } from '@/components/aptixora-logo';
import type { Business } from '@/lib/types';

const businessIcons: Record<string, string> = {
  barbershop: '✂',
  salon: '💇',
  laundry: '🧺',
};

const businessColors: Record<string, { bg: string; text: string; ring: string }> = {
  barbershop: { bg: 'bg-amber-50', text: 'text-amber-900', ring: 'ring-amber-200' },
  salon: { bg: 'bg-pink-50', text: 'text-pink-900', ring: 'ring-pink-200' },
  laundry: { bg: 'bg-cyan-50', text: 'text-cyan-900', ring: 'ring-cyan-200' },
};

export default function BookPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('businesses').select('*').limit(20);
      if (data) setBusinesses(data as Business[]);
      setLoading(false);
    };
    fetch();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-3">
          <div className="h-8 skeleton-pulse rounded w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = businesses.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AptixoraLogo size={26} />
            <span className="font-display font-bold text-sm text-[var(--color-text-primary)]">Aptixora</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            {user && <Link href="/bookings" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Pesanan Saya</Link>}
            <Link href="/track" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Lacak</Link>
            {user ? (
              <Link href="/dashboard" className="text-[var(--color-accent)] hover:underline">Dashboard →</Link>
            ) : (
              <Link href="/auth/login" className="text-[var(--color-accent)] hover:underline">Masuk</Link>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Booking Layanan
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1">
            Pilih bisnis untuk memulai pemesanan
          </p>
        </div>

        {!user && (
          <div className="bento p-3 sm:p-4 mb-5 text-sm bg-[var(--color-warning-light)] border-[var(--color-warning)]">
            <span className="text-[var(--color-warning)] font-semibold">Anda perlu </span>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              masuk
            </button>
            <span className="text-[var(--color-warning)]"> atau </span>
            <button
              onClick={() => router.push('/auth/register')}
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              daftar
            </button>
            <span className="text-[var(--color-warning)]"> untuk melakukan booking.</span>
          </div>
        )}

        <input
          type="text"
          placeholder="Cari bisnis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field mb-4"
        />

        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((biz, i) => {
            const colors = businessColors[biz.business_type] || businessColors.barbershop;
            return (
              <button
                key={biz.id}
                onClick={() => router.push(`/book/${biz.id}`)}
                className={`bento p-4 text-left hover:border-[var(--color-accent)] transition-all slide-up`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                    {businessIcons[biz.business_type] || '◻'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-base text-[var(--color-text-primary)] truncate">
                      {biz.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] capitalize mt-0.5">
                      {biz.business_type}
                      {biz.address && ` · ${biz.address}`}
                    </p>
                  </div>
                  <span className="text-[var(--color-text-muted)] shrink-0">→</span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 bento p-8 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {businesses.length === 0 ? 'Belum ada bisnis yang terdaftar.' : 'Tidak ada hasil.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
