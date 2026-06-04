'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { AptixoraLogo } from '@/components/aptixora-logo';

const businesses = [
  { icon: '✂', label: 'Barbershop', color: 'amber' },
  { icon: '💇', label: 'Salon', color: 'rose' },
  { icon: '🧺', label: 'Laundry', color: 'cyan' },
];

function DashboardPreview() {
  return (
    <div className="hidden lg:flex flex-col w-full max-w-md bg-[#0c1825] rounded-3xl p-5 shadow-2xl relative overflow-hidden border border-white/10">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(190, 24, 93, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(8, 145, 178, 0.3) 0%, transparent 50%)',
      }} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <AptixoraLogo size={24} />
          <span className="text-sm font-display font-bold text-white">Aptixora</span>
        </div>
        <span className="text-[10px] text-pink-300 font-semibold uppercase tracking-wider">Coba Gratis</span>
      </div>
      <div className="mb-3 relative z-10">
        <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Cocok untuk</div>
        <div className="grid grid-cols-3 gap-2">
          {businesses.map((b) => (
            <div key={b.label} className={`bg-white/5 rounded-lg p-2.5 text-center border border-white/10`}>
              <div className="text-2xl mb-0.5">{b.icon}</div>
              <div className="text-[10px] text-white/70 font-semibold">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/10 relative z-10">
        <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Antrean Pintar</div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`text-center py-1.5 rounded ${
              n === 1 ? 'bg-amber-500/30 text-amber-200' :
              n === 2 ? 'bg-cyan-500/20 text-cyan-200' :
              'bg-white/5 text-white/50'
            }`}>
              <div className="font-display font-bold text-sm">#{n + 10}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <div className="bg-gradient-to-br from-pink-500 to-rose-700 rounded-lg p-3">
          <div className="text-[10px] text-white/80 uppercase font-semibold">Pendapatan</div>
          <div className="font-display text-lg font-bold text-white">Rp 1.2jt</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-[10px] text-white/60 uppercase font-semibold">Pelanggan</div>
          <div className="font-display text-lg font-bold text-white">24</div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/auth/join-business');
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <AptixoraLogo size={32} />
              <span className="font-display font-bold text-xl text-[var(--color-text-primary)]">Aptixora</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
            >
              ← Beranda
            </Link>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
            Buat akun gratis
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Setup 2 menit · Tanpa kartu kredit · 14 hari coba gratis
          </p>

          <form onSubmit={handleRegister} className="bento p-5 space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Nama Anda"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="label">Kata Sandi</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 6 karakter"
              />
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full active:scale-[0.97]"
            >
              {loading ? 'Memproses...' : 'Daftar & Mulai'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-[var(--color-text-secondary)]">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-[var(--color-accent)] font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex justify-center">
          <DashboardPreview />
        </div>
      </div>
    </div>
  );
}
