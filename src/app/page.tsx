'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AptixoraLogo } from '@/components/aptixora-logo';
import { AnimatedCounter } from '@/components/ui/animated-counter';

type DemoType = 'barbershop' | 'salon' | 'laundry';

const features = [
  { icon: '📅', title: 'Booking Real-time', desc: 'Slot otomatis terblokir saat dipesan. Konflik terdeteksi sebelum menjadi masalah.', color: 'amber' },
  { icon: '🧺', title: 'Kanban Laundry', desc: 'Drag-drop nota 5 kolom: Masuk → Timbang → Proses → Siap → Selesai.', color: 'cyan' },
  { icon: '👥', title: 'Manajemen Staf', desc: 'Undang via email, role otomatis, utilisasi terpantau real-time.', color: 'rose' },
  { icon: '📊', title: 'Laporan Otomatis', desc: 'Pendapatan harian, mingguan, bulanan. Tanpa hitung manual.', color: 'emerald' },
  { icon: '🔔', title: 'Antrean Pintar', desc: 'Nomor harian, display publik untuk TV toko. Tidak ada "siapa berikutnya?".', color: 'amber' },
  { icon: '⚡', title: 'Update Real-time', desc: 'Status pesanan langsung terkirim ke dashboard. Tanpa refresh.', color: 'cyan' },
];

const industries = [
  { value: 'barbershop' as DemoType, label: 'Barbershop', icon: '✂', gradient: 'from-amber-600 to-amber-900', accent: '#b45309', photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' },
  { value: 'salon' as DemoType, label: 'Salon', icon: '💇', gradient: 'from-pink-500 to-rose-900', accent: '#be185d', photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
  { value: 'laundry' as DemoType, label: 'Laundry', icon: '🧺', gradient: 'from-cyan-500 to-sky-900', accent: '#0e7490', photo: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80' },
];

const trustedLogos = ['BarberBox', 'Salon Kita', 'LaundryKu', 'CutStudio', 'Glow Beauty', 'FreshWash'];

const testimonials = [
  {
    name: 'Budi Hartono',
    role: 'Pemilik, BarberBox Jakarta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    quote: 'Dulu pakai buku tulis, sering hilang. Sekarang pelanggan booking sendiri, antrean jelas, omzet naik 30%.',
    rating: 5,
  },
  {
    name: 'Siti Rahayu',
    role: 'Owner, Salon Kita Bandung',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
    quote: 'Pelanggan bisa lihat slot kosong, booking langsung dari HP. Tidak ada lagi missed appointment. Game changer!',
    rating: 5,
  },
  {
    name: 'Ahmad Fauzi',
    role: 'Pemilik, FreshWash Surabaya',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    quote: 'Timbang kg + Kanban bikin alur kerja jelas. Display TV di toko, pelanggan tinggal lihat nomor sendiri.',
    rating: 5,
  },
];

const faqs = [
  { q: 'Apakah benar-benar gratis?', a: 'Ya, tier gratis selamanya untuk UMKM hingga 50 pesanan/bulan. Tidak perlu kartu kredit, tidak ada biaya tersembunyi.' },
  { q: 'Bagaimana cara mengundang staff?', a: 'Dari menu Staf, masukkan email & nama staff. Mereka dapat link undangan, setelah daftar akun otomatis terhubung ke bisnis Anda dengan role Staff.' },
  { q: 'Apakah data saya aman?', a: 'Data disimpan di Supabase dengan enkripsi at-rest dan in-transit. Row Level Security (RLS) memastikan data tiap bisnis terisolasi. Backup otomatis harian.' },
  { q: 'Bisakah saya migrasi dari sistem lama?', a: 'Tentu. Tim support bisa bantu setup data awal. Cukup kirim list layanan & daftar staff via spreadsheet.' },
  { q: 'Apa beda tier Gratis dan Pro?', a: 'Tier Gratis cukup untuk UMKM kecil (50 pesanan/bulan, 1 staff). Pro unlock pesanan unlimited, staff unlimited, Antrean Pintar publik, dan laporan advanced.' },
  { q: 'Apakah butuh install aplikasi?', a: 'Tidak. Aptixora berjalan di browser, bisa dibuka dari HP, tablet, maupun laptop. Hemat kuota dan storage device Anda.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [demoType, setDemoType] = useState<DemoType>('barbershop');
  const [checking, setChecking] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace('/dashboard'); return; }
      setChecking(false);
    };
    check();
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c1825]">
        <AptixoraLogo size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1825] text-white overflow-x-hidden">
      <Nav />
      <Hero />
      <LogoStrip />
      <DashboardPreview demoType={demoType} onChangeType={setDemoType} />
      <HowItWorks />
      <FeatureDeepDive />
      <Features />
      <Industries />
      <Testimonials />
      <Stats />
      <Pricing />
      <FAQ openFaq={openFaq} setOpenFaq={setOpenFaq} />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0c1825]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <AptixoraLogo size={28} />
          <span className="font-display font-bold text-lg tracking-tight">Aptixora</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="#cara-kerja" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">Cara Kerja</Link>
          <Link href="#fitur" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">Fitur</Link>
          <Link href="#harga" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">Harga</Link>
          <Link href="#faq" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">FAQ</Link>
          <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors">Masuk</Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold bg-white text-[#0c1825] px-4 py-2 rounded-lg hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Daftar Gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' /%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 mb-5 sm:mb-7 text-xs text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time · Antrean pintar · Tanpa kertas
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-5 text-balance">
              Stop catat nota
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
                di kertas
              </span>{' '}
              yang hilang.
            </h1>
            <p className="text-base sm:text-lg text-white/60 mb-7 leading-relaxed max-w-xl">
              Platform operasional untuk{' '}
              <span className="text-amber-300 font-medium">Barbershop</span>,{' '}
              <span className="text-pink-300 font-medium">Salon</span>, dan{' '}
              <span className="text-cyan-300 font-medium">Laundry</span>.
              Booking online, Kanban, laporan otomatis — biar Anda fokus layani pelanggan.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <Link
                href="/auth/register"
                className="bg-white text-[#0c1825] font-semibold px-6 py-3.5 rounded-xl hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10 text-center"
              >
                Mulai Gratis — Setup 2 Menit →
              </Link>
              <a
                href="#preview"
                className="text-white/80 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all text-center"
              >
                ▶ Lihat Demo
              </a>
            </div>
            <p className="text-xs text-white/40 flex items-center gap-3 flex-wrap">
              <span>✓ Tidak perlu kartu kredit</span>
              <span>·</span>
              <span>✓ 14 hari gratis</span>
              <span>·</span>
              <span>✓ Setup 2 menit</span>
            </p>
          </div>

          <div className="relative float">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-amber-500/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-amber-900 to-amber-950">
                <Image
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80"
                  alt="Suasana barbershop modern"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-80"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1825] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live · Booking Masuk
                  </div>
                  <div className="ml-auto bg-amber-500/90 backdrop-blur-md rounded-lg px-3 py-1.5 text-xs font-bold text-[#0c1825]">
                    #A7D
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="px-4 sm:px-6 py-10 border-y border-white/5 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">
          Dipercaya UMKM di berbagai kota
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3">
          {trustedLogos.map((name) => (
            <div
              key={name}
              className="font-display font-bold text-base sm:text-lg text-white/40 hover:text-white/70 transition-colors"
              style={{ letterSpacing: '-0.02em' }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview({ demoType, onChangeType }: { demoType: DemoType; onChangeType: (t: DemoType) => void }) {
  const theme = industries.find((i) => i.value === demoType)!;

  return (
    <section id="preview" className="px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Live Preview</p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mb-3 text-balance">
            Dashboard yang <span className="text-white/60">tidak membosankan</span>
          </h2>
          <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Klik tipe bisnis untuk lihat tampilan dashboard. Setiap industri punya tema & fitur unik.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6 sm:mb-8">
          {industries.map((ind) => (
            <button
              key={ind.value}
              onClick={() => onChangeType(ind.value)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                demoType === ind.value
                  ? 'bg-white text-[#0c1825] scale-105 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{ind.icon}</span>
              <span className="hidden sm:inline">{ind.label}</span>
            </button>
          ))}
        </div>

        <div
          key={demoType}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl scale-in"
          style={{ aspectRatio: '16/10' }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
          <div className="relative h-full flex">
            <div
              className="w-44 sm:w-56 p-3 sm:p-4 flex flex-col gap-1 border-r"
              style={{
                backgroundColor: theme.accent === '#b45309' ? '#2c1810' : theme.accent === '#be185d' ? '#2d1b2e' : '#0a1f2a',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2 pb-3 mb-2 border-b border-white/10">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm">{theme.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: theme.accent === '#b45309' ? '#f5d491' : theme.accent === '#be185d' ? '#f0a0c0' : '#67e8f9' }}>
                    {theme.label}
                  </p>
                  <p className="text-[10px] text-white/40">Demo</p>
                </div>
              </div>
              {['Dashboard', 'Pesanan', 'Layanan', 'Pelanggan', 'Staf', 'Laporan'].map((label, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                    i === 0 ? 'bg-white/10 font-semibold' : 'text-white/40'
                  }`}
                  style={i === 0 ? { color: theme.accent === '#b45309' ? '#f5d491' : theme.accent === '#be185d' ? '#f0a0c0' : '#67e8f9' } : {}}
                >
                  <span className="w-3 h-3 rounded bg-white/20" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-4 sm:p-6 overflow-hidden bg-white/[0.03]">
              {demoType === 'laundry' ? <LaundryMock /> : demoType === 'salon' ? <SalonMock /> : <BarberMock />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BarberMock() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full">
      <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Antrean</div>
        <div className="font-display text-2xl sm:text-3xl font-bold text-amber-300">12</div>
      </div>
      <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Kapster</div>
        <div className="font-display text-2xl sm:text-3xl font-bold text-white">3</div>
      </div>
      <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Pendapatan</div>
        <div className="font-display text-base sm:text-xl font-bold text-white">Rp 850k</div>
      </div>
      <div className="col-span-3 grid grid-cols-12 gap-1 sm:gap-2 flex-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="bg-white/5 rounded p-1.5 text-[10px] text-white/30 border border-white/5">
            <div className="text-white/50 font-medium">{7 + i}:00</div>
            {i % 2 === 0 && <div className="mt-1 px-1.5 py-0.5 bg-amber-400/20 text-amber-200 rounded text-[9px] truncate">Budi · Rp50k</div>}
            {i % 3 === 0 && i % 2 !== 0 && <div className="mt-1 px-1.5 py-0.5 bg-amber-400/20 text-amber-200 rounded text-[9px] truncate">Siti</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SalonMock() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 h-full">
      <div className="col-span-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Aktif</div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-pink-300">8</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Staf</div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white">4</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Hari Ini</div>
          <div className="font-display text-base sm:text-xl font-bold text-white">Rp 1.2jt</div>
        </div>
      </div>
      <div className="col-span-2 bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Utilisasi Staf</div>
        {['Rina', 'Maya', 'Dewi', 'Lia'].map((n, i) => (
          <div key={n} className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-white/50 w-10">{n}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded">
              <div className="h-full rounded bg-pink-400" style={{ width: `${[85, 60, 40, 25][i]}%` }} />
            </div>
            <span className="text-[10px] text-white/50 w-6 text-right">{[9, 6, 4, 2][i]}</span>
          </div>
        ))}
      </div>
      <div className="col-span-2 bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Booking Hari Ini</div>
        {['09:00 Hair Color', '10:30 Smoothing', '13:00 Creambath', '15:00 Potong'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 text-[10px] mb-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${i < 2 ? 'bg-pink-400' : 'bg-white/20'}`} />
            <span className="text-white/70">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaundryMock() {
  const cols = [
    { name: 'Masuk', count: 3, color: 'bg-cyan-500' },
    { name: 'Timbang', count: 2, color: 'bg-cyan-400' },
    { name: 'Proses', count: 4, color: 'bg-cyan-300' },
    { name: 'Siap', count: 1, color: 'bg-emerald-400' },
    { name: 'Selesai', count: 5, color: 'bg-white/20' },
  ];
  return (
    <div className="h-full flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Total Berat</div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-cyan-300">42.5 kg</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Nota Aktif</div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white">9</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Siap Ambil</div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-300">1</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2 flex-1">
        {cols.map((c) => (
          <div key={c.name} className="bg-white/5 rounded-lg p-1.5 border border-white/10 flex flex-col">
            <div className="text-[9px] uppercase tracking-wider text-white/50 mb-1 font-semibold">{c.name} ({c.count})</div>
            <div className="flex-1 space-y-1">
              {Array.from({ length: c.count }, (_, i) => (
                <div key={i} className="bg-white/10 rounded p-1 text-[9px] text-white/70">
                  <div className="font-semibold">#{1000 + i}</div>
                  <div className="text-white/40">{(Math.random() * 5 + 1).toFixed(1)}kg</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Daftar & Pilih Industri',
      desc: 'Buat akun gratis, pilih tipe bisnis (Barbershop, Salon, atau Laundry). Tema dashboard otomatis menyesuaikan.',
      color: '#f59e0b',
    },
    {
      num: '02',
      title: 'Tambah Layanan & Staf',
      desc: 'Atur daftar layanan, harga, dan durasi. Undang staff via email — mereka otomatis punya akses sesuai role.',
      color: '#06b6d4',
    },
    {
      num: '03',
      title: 'Mulai Terima Pesanan',
      desc: 'Pelanggan booking dari HP, atau Anda input walk-in. Antrean, Kanban, dan laporan berjalan otomatis.',
      color: '#10b981',
    },
  ];
  return (
    <section id="cara-kerja" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Cara Kerja</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            Dari daftar ke pesanan pertama
            <br />
            <span className="text-white/50">dalam 2 menit.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-amber-500/0 via-cyan-500/40 to-emerald-500/0" />
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 slide-up hover:bg-white/[0.06] transition-colors"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div
                className="font-display text-5xl sm:text-6xl font-bold tracking-tighter mb-3"
                style={{ color: s.color }}
              >
                {s.num}
              </div>
              <h3 className="font-display font-bold text-lg mb-2 tracking-tight">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureDeepDive() {
  const dives = [
    {
      tag: 'Booking Online',
      title: 'Pelanggan booking sendiri dari HP.',
      desc: 'Pelanggan pilih layanan, staf, dan slot waktu. Sistem otomatis blokir slot yang sudah dipesan. Tidak ada lagi "tadi masih kosong kok".',
      bullets: ['Slot real-time, anti-double-book', 'Notifikasi email & WhatsApp (coming soon)', 'Customer lihat histori pesanan'],
      cta: 'Coba Booking →',
      href: '/book',
      image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80',
      color: '#10b981',
    },
    {
      tag: 'Kanban Visual',
      title: 'Drag-drop nota, lihat alur kerja.',
      desc: 'Tidak perlu training. Interface Kanban yang sama seperti Trello/Linear. Status nota selalu jelas — siapa yang berikutnya, mana yang lama.',
      bullets: ['5 kolom: Masuk → Timbang → Proses → Siap → Selesai', 'Estimasi selesai otomatis dari durasi layanan', 'Drag pakai mouse atau sentuh di mobile'],
      cta: 'Lihat Dashboard →',
      href: '/dashboard/laundry',
      image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80',
      color: '#0ea5e9',
      reverse: true,
    },
    {
      tag: 'Smart Queue Display',
      title: 'Tampilan publik untuk TV toko.',
      desc: 'Aktifkan Smart Queue, pelanggan lain bisa lihat "sedang dilayani siapa" + "selanjutnya siapa" di TV toko atau link publik. Tidak ada yang perlu bertanya.',
      bullets: ['Nomor antrean harian, reset otomatis tiap hari', 'Link publik, bisa dibuka customer dari HP', 'Update real-time tanpa refresh'],
      cta: 'Lihat Display Demo →',
      href: '/queue/demo',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
      color: '#f59e0b',
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-6xl mx-auto space-y-16 sm:space-y-24">
        {dives.map((d, i) => (
          <div
            key={d.title}
            className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${d.reverse ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className={d.reverse ? 'lg:order-2' : ''}>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 inline-block px-2.5 py-1 rounded-md"
                style={{ color: d.color, backgroundColor: `${d.color}20` }}
              >
                {d.tag}
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
                {d.title}
              </h3>
              <p className="text-base text-white/60 mb-5 leading-relaxed">{d.desc}</p>
              <ul className="space-y-2.5 mb-6">
                {d.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={d.href}
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all"
                style={{ color: d.color }}
              >
                {d.cta}
              </Link>
            </div>
            <div className={`relative ${d.reverse ? 'lg:order-1' : ''}`}>
              <div
                className="absolute -inset-3 rounded-2xl blur-2xl opacity-30"
                style={{ backgroundColor: d.color }}
              />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src={d.image}
                  alt={d.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1825]/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="fitur" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Fitur Lengkap</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            Semua yang Anda butuhkan.
            <br />
            <span className="text-white/50">Tidak ada yang tidak perlu.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-5 sm:p-6 transition-all hover:border-white/20 hover:-translate-y-0.5 slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-bold text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries() {
  return (
    <section id="industri" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Industri</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            Dibuat untuk 3 industri spesifik.
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
            Tidak semua bisnis sama. Setiap industri punya workflow & tema visual sendiri.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {industries.map((ind) => (
            <div
              key={ind.value}
              className="group relative overflow-hidden rounded-2xl border border-white/10 hover:scale-[1.02] transition-transform h-72"
            >
              <Image
                src={ind.photo}
                alt={ind.label}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${ind.gradient} mix-blend-multiply opacity-85`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1825] via-transparent to-transparent" />
              <div className="relative h-full flex flex-col justify-between p-6">
                <div className="text-5xl">{ind.icon}</div>
                <div>
                  <h3 className="font-display font-bold text-2xl mb-2">{ind.label}</h3>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {ind.value === 'barbershop' && 'Janji kapster, antrean walk-in, laporan harian.'}
                    {ind.value === 'salon' && 'Slot per treatment, utilisasi staff, layanan kecantikan.'}
                    {ind.value === 'laundry' && 'Timbang kg, Kanban 5 kolom, display siap ambil.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Testimoni Pelanggan</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            UMKM lokal sudah{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              lebih untung
            </span>
            .
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 hover:bg-white/[0.05] transition-colors slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-0.5 mb-3 text-amber-400">
                {Array.from({ length: t.rating }, (_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-5 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{t.name}</p>
                  <p className="text-xs text-white/50 truncate">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: 3, suffix: '', label: 'Industri UMKM', desc: 'Barbershop, Salon, Laundry', color: '#10b981' },
    { value: 2, suffix: ' menit', label: 'Setup', desc: 'Daftar, buat bisnis, langsung jalan', color: '#0ea5e9' },
    { value: 100, suffix: '%', label: 'Realtime', desc: 'Update status, antrean, notifikasi', color: '#f59e0b' },
    { value: 0, suffix: ' rupiah', label: 'Tier Gratis', desc: 'Cocok untuk UMKM baru mulai', color: '#ec4899' },
  ];
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">
            Kenapa Aptixora
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            Dibangun untuk kecepatan & kesederhanaan
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bento-dark p-4 sm:p-5 slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-1"
                style={{ color: s.color }}
              >
                <AnimatedCounter value={s.value} suffix={s.suffix} duration={1200} />
              </p>
              <p className="font-display font-bold text-sm text-white">{s.label}</p>
              <p className="text-[11px] text-white/50 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="harga" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Harga</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            Mulai gratis.
            <br />
            <span className="text-white/50">Bayar hanya saat berkembang.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/[0.05] transition-colors">
            <h3 className="font-display font-bold text-xl mb-1">Gratis</h3>
            <p className="text-white/50 text-sm mb-5">Untuk UMKM yang baru mulai</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-bold">Rp 0</span>
              <span className="text-white/50 text-sm">/bulan</span>
            </div>
            <ul className="space-y-2.5 text-sm text-white/70">
              {['Hingga 50 pesanan/bulan', '1 akun staff', 'Dashboard dasar', 'Laporan bulanan'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-400/30 rounded-2xl p-6 sm:p-8 hover:scale-[1.02] transition-transform">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-[#0c1825] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Paling Populer
            </div>
            <h3 className="font-display font-bold text-xl mb-1">Pro</h3>
            <p className="text-white/70 text-sm mb-5">Untuk bisnis yang sedang tumbuh</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-bold">Rp 99k</span>
              <span className="text-white/50 text-sm">/bulan</span>
            </div>
            <ul className="space-y-2.5 text-sm text-white/80">
              {['Pesanan unlimited', 'Staff unlimited', 'Antrean pintar publik', 'Laporan & analitik', 'Export Excel/PDF', 'Support prioritas'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ({ openFaq, setOpenFaq }: { openFaq: number | null; setOpenFaq: (i: number | null) => void }) {
  return (
    <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">FAQ</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Pertanyaan yang sering ditanya
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div
                key={f.q}
                className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-sm sm:text-base text-white">{f.q}</span>
                  <span
                    className="text-white/40 shrink-0 transition-transform"
                    style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
                  >
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all"
                  style={{
                    maxHeight: open ? '300px' : '0',
                    opacity: open ? 1 : 0,
                  }}
                >
                  <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-white/60 leading-relaxed">
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"
              alt="Suasana toko UMKM"
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c1825]/85 via-[#0c1825]/75 to-emerald-900/80" />
          </div>
          <div className="relative p-8 sm:p-12 md:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 text-balance">
              Siap digitalisasi
              <br />
              bisnis Anda?
            </h2>
            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-7 sm:mb-9">
              Setup dalam 2 menit. Tidak perlu install. Tidak perlu kartu kredit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto bg-white text-[#0c1825] font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl hover:bg-white/90 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-2xl text-sm sm:text-base"
              >
                Buat Akun Gratis →
              </Link>
              <Link
                href="/book"
                className="w-full sm:w-auto text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all text-sm sm:text-base"
              >
                Coba Booking Dulu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-4 sm:px-6 py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <AptixoraLogo size={24} />
              <span className="font-display font-bold text-base text-white">Aptixora</span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Platform operasional untuk UMKM Indonesia. Booking, Kanban, dan laporan otomatis dalam satu aplikasi.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Produk</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="#fitur" className="text-white/60 hover:text-white transition-colors">Fitur</Link></li>
              <li><Link href="#harga" className="text-white/60 hover:text-white transition-colors">Harga</Link></li>
              <li><Link href="#cara-kerja" className="text-white/60 hover:text-white transition-colors">Cara Kerja</Link></li>
              <li><Link href="#faq" className="text-white/60 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Mulai</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/register" className="text-white/60 hover:text-white transition-colors">Daftar Gratis</Link></li>
              <li><Link href="/auth/login" className="text-white/60 hover:text-white transition-colors">Masuk</Link></li>
              <li><Link href="/book" className="text-white/60 hover:text-white transition-colors">Coba Booking</Link></li>
              <li><Link href="/track" className="text-white/60 hover:text-white transition-colors">Lacak Pesanan</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2026 Aptixora. Dibuat untuk UMKM Indonesia.</p>
          <p className="text-xs text-white/40">🇮🇩 Bahasa Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
