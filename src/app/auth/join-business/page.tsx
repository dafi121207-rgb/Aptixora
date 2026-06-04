'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AptixoraLogo } from '@/components/aptixora-logo';
import type { Business, Invitation } from '@/lib/types';

const businessIcons: Record<string, string> = {
  barbershop: '✂',
  salon: '💇',
  laundry: '🧺',
};

export default function JoinBusinessPage() {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<(Invitation & { business: Business })[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: existingUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (existingUser?.role === 'OWNER' || existingUser?.role === 'STAFF') {
        router.push('/dashboard');
        return;
      }

      const { data: invites } = await supabase
        .from('staff_invitations')
        .select('*, business:businesses(*)')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (!invites || invites.length === 0) {
        router.push('/auth/select-business');
        return;
      }

      setInvitations(invites as any);
      setLoading(false);
    };

    check();
  }, [supabase, router]);

  const handleAccept = async (invitationId: string) => {
    setAccepting(invitationId);
    setError(null);

    const { error: rpcErr } = await supabase.rpc('accept_staff_invitation', {
      p_invitation_id: invitationId,
    });

    if (rpcErr) { setError(rpcErr.message); setAccepting(null); return; }

    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-72 space-y-3">
          <div className="h-5 skeleton-pulse rounded-md w-3/4 mx-auto" />
          <div className="h-5 skeleton-pulse rounded-md w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <AptixoraLogo size={28} />
          <span className="font-display font-bold text-lg text-[var(--color-text-primary)]">Aptixora</span>
        </div>
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">
            Anda Diundang!
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Bergabung dengan bisnis sebagai staff
          </p>
        </div>

        <div className="space-y-3">
          {invitations.map((inv, i) => (
            <div
              key={inv.id}
              className="bento p-5 slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-2xl shrink-0">
                  {businessIcons[inv.business.business_type] || '◻'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] truncate">
                    {inv.business.name}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] capitalize">
                    {inv.business.business_type}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Diundang sebagai <span className="font-semibold text-[var(--color-text-primary)]">{inv.full_name}</span>
              </p>
              <button
                onClick={() => handleAccept(inv.id)}
                disabled={accepting === inv.id}
                className="btn btn-primary w-full"
              >
                {accepting === inv.id ? 'Memproses...' : 'Gabung Bisnis'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-[var(--color-danger)] mt-3 text-center">{error}</p>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth/select-business')}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            Buat bisnis baru saja →
          </button>
        </div>
      </div>
    </div>
  );
}
