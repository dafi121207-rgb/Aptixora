'use client';

import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AptixoraMark } from '@/components/aptixora-logo';
import { Avatar } from '@/components/ui/avatar';
import { LiveClock } from '@/components/ui/live-clock';

const navItems = (businessType?: string) => [
  { label: 'Dashboard', href: businessType ? `/dashboard/${businessType}` : '/dashboard', icon: '◻' },
  { label: 'Pesanan', href: '/dashboard/orders', icon: '📋' },
  { label: 'Layanan', href: '/dashboard/services', icon: '⚙' },
];

const ownerNavItems = [
  { label: 'Pelanggan', href: '/dashboard/customers', icon: '👤' },
  { label: 'Staf', href: '/dashboard/staff', icon: '👥' },
  { label: 'Laporan', href: '/dashboard/reports', icon: '📊' },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: '⚙' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stuckSeconds, setStuckSeconds] = useState(0);

  useEffect(() => {
    if (!loading) { setStuckSeconds(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      setStuckSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role === 'OWNER' && !business) { router.push('/auth/select-business'); return; }
  }, [user, business, loading, router]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (loading) {
    const stuck = stuckSeconds >= 6;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <div className="w-80 space-y-4 text-center">
          <div className="space-y-3">
            <div className="h-5 skeleton-pulse rounded w-3/4 mx-auto" />
            <div className="h-5 skeleton-pulse rounded w-1/2 mx-auto" />
            <div className="h-5 skeleton-pulse rounded w-2/3 mx-auto" />
          </div>
          {stuck && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-[var(--color-danger)] font-semibold">
                Koneksi lambat ({stuckSeconds}s)
              </p>
              <button
                onClick={() => router.refresh()}
                className="btn btn-primary text-xs w-full"
              >
                ↻ Refresh Halaman
              </button>
              <button
                onClick={async () => { await signOut(); router.push('/auth/login'); }}
                className="btn btn-secondary text-xs w-full"
              >
                Keluar & Masuk Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (user.role === 'OWNER' && !business) return null;

  const isOwner = user.role === 'OWNER';
  const isClient = user.role === 'CLIENT';

  if (isClient) {
    router.push('/auth/join-business');
    return null;
  }

  const themeClass = business ? `theme-${business.business_type}` : '';

  const Sidebar = (
    <aside className="w-64 sidebar flex flex-col h-full">
      <div className="p-4 sidebar-brand">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            {business
              ? <span className="text-lg">{business.business_type === 'barbershop' ? '✂' : business.business_type === 'salon' ? '💇' : '🧺'}</span>
              : <AptixoraMark size={18} className="text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--color-sidebar-text)' }}>
              {business?.name ?? 'Aptixora'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-sidebar-text-secondary)' }}>
              {business?.business_type === 'barbershop' ? 'Barbershop' : business?.business_type === 'salon' ? 'Salon' : business?.business_type === 'laundry' ? 'Laundry' : ''}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems(business?.business_type).map((item) => {
          const bizDashboards = ['/dashboard/barbershop', '/dashboard/salon', '/dashboard/laundry'];
          const active = bizDashboards.includes(item.href)
            ? bizDashboards.includes(pathname)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? 'active' : ''}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {isOwner && (
          <>
            <div className="pt-3 pb-1.5 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-sidebar-text-secondary)', opacity: 0.7 }}>
                Pengelolaan
              </p>
            </div>
            {ownerNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? 'active' : ''}`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        {business?.queue_enabled && business?.queue_slug && (
          <>
            <div className="pt-3 pb-1.5 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-sidebar-text-secondary)', opacity: 0.7 }}>
                Publik
              </p>
            </div>
            <Link
              href={`/queue/${business.queue_slug}`}
              target="_blank"
              className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            >
              <span className="text-base w-5 text-center">📺</span>
              <span className="font-medium">Display Antrean</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--color-sidebar-text-secondary)', opacity: 0.2 }}>
        <div className="flex items-center gap-2.5">
          <Avatar name={user.full_name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-sidebar-text)' }}>
              {user.full_name}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1" style={{ color: 'var(--color-sidebar-text-secondary)' }}>
              <LiveClock showSeconds={false} />
              <span>·</span>
              <span>{user.role.toLowerCase() === 'owner' ? 'Pemilik' : 'Staff'}</span>
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-xs font-medium px-2 py-1.5 rounded transition-colors shrink-0"
            style={{ color: 'var(--color-sidebar-text-secondary)' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-sidebar-text-secondary)'}
            title="Keluar"
          >
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className={`flex min-h-screen ${themeClass}`} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="hidden md:flex shrink-0">
        {Sidebar}
      </div>

      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 slide-down">
            {Sidebar}
          </div>
        </>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {business && (
              <span className="text-lg">
                {business.business_type === 'barbershop' ? '✂' : business.business_type === 'salon' ? '💇' : '🧺'}
              </span>
            )}
            <span className="font-display font-bold text-sm text-[var(--color-text-primary)] truncate">
              {business?.name ?? 'Aptixora'}
            </span>
          </div>
          <Avatar name={user.full_name} size={36} />
        </header>

        <div className="p-4 sm:p-6 lg:p-8 bg-pattern min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
