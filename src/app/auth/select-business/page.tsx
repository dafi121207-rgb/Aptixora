'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { AptixoraLogo } from '@/components/aptixora-logo';
import type { BusinessType } from '@/lib/types';

const businessTypes: {
  value: BusinessType;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: 'barbershop',
    label: 'Barbershop',
    desc: 'Janji temu kapster, antrean walk-in, laporan harian',
    icon: '✂',
  },
  {
    value: 'salon',
    label: 'Salon',
    desc: 'Booking slot, utilisasi staff, layanan kecantikan',
    icon: '💇',
  },
  {
    value: 'laundry',
    label: 'Laundry',
    desc: 'Timbang kg, Kanban 5 kolom, notifikasi siap ambil',
    icon: '🧺',
  },
];

export default function SelectBusinessPage() {
  const [selected, setSelected] = useState<BusinessType | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user, refreshBusiness, refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !name.trim() || !user) return;

    setError(null);
    setLoading(true);

    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'OWNER' })
      .eq('id', user.id);

    if (roleError) {
      setError('Gagal update role: ' + roleError.message);
      setLoading(false);
      return;
    }

    const { error: bizError } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: name.trim(),
      business_type: selected,
    });

    if (bizError) {
      setError('Gagal buat bisnis: ' + bizError.message);
      setLoading(false);
      return;
    }

    await refreshUser();
    await refreshBusiness();

    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  useEffect(() => {
    if (user?.role === 'OWNER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6">
          <AptixoraLogo size={28} />
          <span className="font-display font-bold text-lg text-[var(--color-text-primary)]">Aptixora</span>
        </div>

        {!selected ? (
          <>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
              Pilih jenis usaha
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Pilih industri yang sesuai dengan bisnis Anda
            </p>
            <div className="space-y-2.5">
              {businessTypes.map((bt, i) => (
                <button
                  key={bt.value}
                  type="button"
                  onClick={() => setSelected(bt.value)}
                  className="bento w-full p-4 text-left hover:border-[var(--color-accent)] transition-all slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-2xl shrink-0">
                      {bt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-base text-[var(--color-text-primary)]">{bt.label}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{bt.desc}</p>
                    </div>
                    <span className="text-[var(--color-text-muted)] self-center">→</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
              Setup {businessTypes.find((bt) => bt.value === selected)?.label}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Beri nama bisnis Anda untuk memulai
            </p>
            <form onSubmit={handleSubmit} className="bento p-5 space-y-4">
              <div>
                <label className="label">Nama Usaha</label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="cth: Barbershop Pak Tio"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSelected(null); setName(''); setError(null); }}
                  className="btn btn-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn btn-primary flex-[2]"
                >
                  {loading ? 'Menyiapkan...' : 'Mulai'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
