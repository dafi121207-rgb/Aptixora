'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export default function SettingsPage() {
  const { business, user, refreshBusiness } = useAuth();
  const [name, setName] = useState(business?.name ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [phone, setPhone] = useState(business?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (user?.role !== 'OWNER') {
    router.push('/dashboard');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await supabase
      .from('businesses')
      .update({ name, address: address || null, phone: phone || null })
      .eq('id', business.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshBusiness();
    setSaved(true);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-5">
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Pengaturan Bisnis
      </h1>

      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
            Nama Bisnis
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
            Alamat
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            placeholder="Alamat usaha"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">
            Telepon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            placeholder="Nomor telepon"
          />
        </div>

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        {saved && (
          <p className="text-sm text-[var(--color-success)]">
            Pengaturan berhasil disimpan.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>

      <div className="bento mt-6 p-5">
        <h2 className="font-display font-bold text-base mb-3 text-[var(--color-text-primary)]">
          Antrean Pintar (Smart Queue)
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Aktifkan tampilan antrean publik yang bisa dibuka di TV/HP pelanggan.
        </p>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-secondary)]">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Tampilkan Antrean Publik</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {business?.queue_enabled
                ? `Aktif di /queue/${business?.queue_slug}`
                : 'Nonaktif'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={business?.queue_enabled || false}
              onChange={async (e) => {
                if (!business) return;
                const enabled = e.target.checked;
                const slug = business.queue_slug || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
                await supabase
                  .from('businesses')
                  .update({ queue_enabled: enabled, queue_slug: enabled ? slug : null })
                  .eq('id', business.id);
                await refreshBusiness();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-border)] rounded-full peer peer-checked:bg-[var(--color-accent)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
        {business?.queue_enabled && business?.queue_slug && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--color-accent-light)] text-sm">
            <p className="font-semibold text-[var(--color-accent)] mb-1">URL Antrean Publik:</p>
            <a
              href={`/queue/${business.queue_slug}`}
              target="_blank"
              className="text-[var(--color-accent)] font-mono text-xs break-all hover:underline"
            >
              /queue/{business.queue_slug}
            </a>
          </div>
        )}
      </div>

      <div className="bento mt-6 p-5">
        <h2 className="font-display font-bold text-base mb-3 text-[var(--color-text-primary)]">
          Info Bisnis
        </h2>
        <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <p>ID: {business?.id}</p>
          <p>Tipe: {business?.business_type}</p>
          <p>Owner ID: {business?.owner_id}</p>
          <p>
            Link Booking:{' '}
            <a
              href={`/book/${business?.id}`}
              className="text-[var(--color-accent)] hover:underline"
              target="_blank"
            >
              /book/{business?.id}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
