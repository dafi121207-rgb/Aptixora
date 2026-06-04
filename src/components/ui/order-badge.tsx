type StatusStyle = {
  bg: string;
  text: string;
  border: string;
};

const statusStyle: Record<string, StatusStyle> = {
  pending: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', border: 'var(--color-warning)' },
  weighing: { bg: 'var(--color-accent-light)', text: 'var(--color-accent)', border: 'var(--color-accent)' },
  processing: { bg: 'var(--color-accent-light)', text: 'var(--color-accent)', border: 'var(--color-accent)' },
  ready: { bg: 'var(--color-success-light)', text: 'var(--color-success)', border: 'var(--color-success)' },
  completed: { bg: 'var(--color-surface-secondary)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  cancelled: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', border: 'var(--color-danger)' },
};

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  weighing: 'Ditimbang',
  processing: 'Diproses',
  ready: 'Siap Ambil',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export function OrderBadge({ status }: { status: string }) {
  const s = statusStyle[status] || statusStyle.completed;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: s.bg,
        color: s.text,
        border: `1px solid ${s.border}33`,
      }}
    >
      {statusLabel[status] || status}
    </span>
  );
}
