'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { serviceColor } from '@/components/ui/service-color';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import type { Service } from '@/lib/types';

export default function ServicesPage() {
  const { business, user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (!business) { setLoading(false); return; }
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .order('name');
      if (data) setServices(data as Service[]);
      setLoading(false);
    };
    fetchServices();
  }, [business, supabase]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const { data, error } = await supabase
      .from('services')
      .insert({
        business_id: business.id,
        name,
        price: parseFloat(price),
        duration_minutes: duration ? parseInt(duration) : null,
        unit_type: unit || null,
      })
      .select()
      .single();

    if (!error && data) {
      setServices((prev) => [...prev, data as Service]);
      setName('');
      setPrice('');
      setDuration('');
      setUnit('');
      setShowForm(false);
      toast('Layanan berhasil ditambahkan', 'success');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      setDeleteTarget(null);
      toast('Layanan berhasil dihapus', 'success');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 skeleton-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Layanan
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            <AnimatedCounter value={services.length} /> layanan terdaftar
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Batal' : '+ Layanan'}
          </button>
        )}
      </div>

      {showForm && isOwner && (
        <form onSubmit={handleAdd} className="bento p-4 sm:p-5 space-y-3 slide-down">
          <input
            type="text"
            placeholder="Nama layanan (cth: Potong Rambut)"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            autoFocus
          />
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Harga"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Durasi (menit)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Satuan (kg/sesi/pcs)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full sm:w-auto">
            Simpan
          </button>
        </form>
      )}

      {services.length === 0 ? (
        <div className="bento p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Belum ada layanan. Tambahkan layanan pertama Anda.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc, i) => {
            const c = serviceColor(svc.name);
            return (
              <div
                key={svc.id}
                className="bento p-4 slide-up relative overflow-hidden"
                style={{
                  animationDelay: `${i * 30}ms`,
                  borderLeft: `4px solid ${c.border}`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-display font-bold text-base text-[var(--color-text-primary)]">
                    {svc.name}
                  </p>
                  {isOwner && (
                    <button
                      onClick={() => setDeleteTarget(svc.id)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="font-display text-2xl font-bold text-[var(--color-accent)]">
                  Rp{svc.price.toLocaleString('id-ID')}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] flex-wrap">
                  {svc.duration_minutes && (
                    <span className="px-1.5 py-0.5 bg-[var(--color-surface-secondary)] rounded">
                      {svc.duration_minutes} menit
                    </span>
                  )}
                  {svc.unit_type && (
                    <span
                      className="px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1"
                      style={{ backgroundColor: c.bg, color: c.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.border }} />
                      per {svc.unit_type}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Layanan"
        message="Apakah Anda yakin ingin menghapus layanan ini?"
        confirmLabel="Hapus"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
