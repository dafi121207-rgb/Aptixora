'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { AptixoraLogo } from '@/components/aptixora-logo';

const features = [
  { icon: '📅', label: 'Booking', color: 'amber' },
  { icon: '🧺', label: 'Kanban', color: 'cyan' },
  { icon: '👥', label: 'Staf', color: 'rose' },
  { icon: '📊', label: 'Laporan', color: 'emerald' },
];

function DashboardPreview() {
  return (
    <div className="hidden lg:flex flex-col w-full max-w-md bg-[#0c1825] rounded-3xl p-5 shadow-2xl relative overflow-hidden border border-white/10">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(8, 145, 178, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.2) 0%, transparent 50%)',
      }} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <AptixoraLogo size={24} />
          <span className="text-sm font-display font-bold text-white">Aptixora</span>
        </div>
        <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Live</span>
      </div>
      <div className="flex gap-2 mb-3 relative z-10">
        {features.map((f) => (
          <div key={f.label} className="flex-1 bg-white/5 rounded-lg p-2 text-center border border-white/10">
            <div className="text-xl mb-0.5">{f.icon}</div>
            <div className="text-[10px] text-white/60 font-medium">{f.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/10 relative z-10">
        <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Pesanan Hari Ini</div>
        {[
          { name: 'Budi', time: '09:00', price: '50k', status: 'pending' },
          { name: 'Siti', time: '10:30', price: '120k', status: 'progress' },
          { name: 'Andi', time: '13:00', price: '35k', status: 'done' },
        ].map((o) => (
          <div key={o.name} className="flex items-center justify-between py-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                o.status === 'pending' ? 'bg-amber-400' :
                o.status === 'progress' ? 'bg-cyan-400' :
                'bg-emerald-400'
              }`} />
              <span className="text-white/80 truncate">{o.name}</span>
              <span className="text-white/40 text-[10px]">{o.time}</span>
            </div>
            <span className="text-white font-semibold shrink-0">Rp{o.price}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg p-2.5">
          <div className="text-[9px] text-white/80 uppercase font-semibold">Antrean</div>
          <div className="font-display text-xl font-bold text-white">12</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
          <div className="text-[9px] text-white/60 uppercase font-semibold">Selesai</div>
          <div className="font-display text-xl font-bold text-white">8</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
          <div className="text-[9px] text-white/60 uppercase font-semibold">Hari Ini</div>
          <div className="font-display text-sm font-bold text-white">Rp 850k</div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
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
            Selamat datang kembali
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Masuk untuk kelola operasional bisnis Anda
          </p>

          <form onSubmit={handleLogin} className="bento p-5 space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full active:scale-[0.97]"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-[var(--color-text-secondary)]">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-[var(--color-accent)] font-semibold hover:underline">
              Daftar gratis
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
