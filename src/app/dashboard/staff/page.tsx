'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRouter } from 'next/navigation';
import type { User, Invitation } from '@/lib/types';

export default function StaffPage() {
  const { business, user } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!business) { setLoading(false); return; }
    if (user?.role !== 'OWNER') { router.push('/dashboard'); return; }

    const fetchData = async () => {
      const [staffRes, inviteRes] = await Promise.all([
        supabase
          .from('staff_business')
          .select('user_id, users!user_id(id, full_name, email, role)')
          .eq('business_id', business.id),
        supabase
          .from('staff_invitations')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
      ]);

      if (staffRes.data) {
        const mapped = staffRes.data
          .map((s: any) => s.users)
          .filter(Boolean) as User[];
        setStaffList(mapped);
      }

      if (inviteRes.data) setInvitations(inviteRes.data as Invitation[]);
      setLoading(false);
    };

    fetchData();
  }, [business, user, supabase, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user) return;
    setError(null);
    setAdding(true);

    const existing = staffList.find((s) => s.email === email) ||
      invitations.find((i) => i.email === email && i.status === 'pending');

    if (existing) {
      setError('Email sudah terdaftar sebagai staff atau sudah diundang.');
      setAdding(false);
      return;
    }

    const { error: inviteError } = await supabase
      .from('staff_invitations')
      .insert({
        business_id: business.id,
        email,
        full_name: name,
        invited_by: user.id,
      });

    if (inviteError) {
      setError(inviteError.message);
      setAdding(false);
      return;
    }

    toast('Undangan staff berhasil dikirim', 'success');
    setEmail('');
    setName('');

    const { data } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (data) setInvitations(data as Invitation[]);
    setAdding(false);
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!business) return;

    await supabase
      .from('staff_business')
      .delete()
      .eq('user_id', staffId)
      .eq('business_id', business.id);

    await supabase
      .from('users')
      .update({ role: 'CLIENT' })
      .eq('id', staffId);

    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    setRemoveTarget(null);
    toast('Staff berhasil dihapus', 'success');
  };

  const cancelInvitation = async (inviteId: string) => {
    await supabase
      .from('staff_invitations')
      .update({ status: 'expired' })
      .eq('id', inviteId);

    setInvitations((prev) =>
      prev.map((i) =>
        i.id === inviteId ? { ...i, status: 'expired' as const } : i
      )
    );
    toast('Undangan dibatalkan', 'info');
  };

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 skeleton-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const pendingInvites = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Kelola Staf
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Undang staff via email. Mereka akan otomatis jadi STAFF setelah daftar.
        </p>
      </div>

      <form onSubmit={handleInvite} className="bento p-4 sm:p-5 space-y-3">
        <h2 className="font-display font-bold text-sm text-[var(--color-text-primary)]">
          Undang Staff Baru
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nama lengkap"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email staff"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={adding}
          className="btn btn-primary w-full sm:w-auto"
        >
          {adding ? 'Mengirim...' : 'Kirim Undangan'}
        </button>
      </form>

      {pendingInvites.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm mb-3 text-[var(--color-text-primary)]">
            Undangan Pending ({pendingInvites.length})
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="bento p-3 flex items-center justify-between"
                style={{ borderColor: 'var(--color-warning)' }}
              >
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {inv.full_name}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {inv.email} · Menunggu daftar
                  </p>
                </div>
                <button
                  onClick={() => cancelInvitation(inv.id)}
                  className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-colors px-2 py-1"
                >
                  Batal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-sm mb-3 text-[var(--color-text-primary)]">
          Staff Aktif ({staffList.length})
        </h2>
        {staffList.length === 0 ? (
          <div className="bento p-8 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Belum ada staff. Undang staff untuk bergabung.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="bento p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-[var(--color-accent-light)] rounded-full flex items-center justify-center text-[var(--color-accent)] font-bold text-sm shrink-0">
                    {staff.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                      {staff.full_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {staff.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRemoveTarget(staff.id)}
                  className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors px-2 py-1"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Hapus Staff"
        message="Staff akan kehilangan akses ke dashboard bisnis ini."
        confirmLabel="Hapus"
        onConfirm={() => removeTarget && handleRemoveStaff(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
