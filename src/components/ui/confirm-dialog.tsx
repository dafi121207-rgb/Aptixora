'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full shadow-xl">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-5">
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${
              danger
                ? 'bg-[var(--color-danger)] hover:opacity-90'
                : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
