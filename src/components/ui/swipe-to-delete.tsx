'use client';

import { useRef, useState, type ReactNode } from 'react';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
  threshold?: number;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteLabel = 'Hapus',
  className,
  threshold = 80,
}: SwipeToDeleteProps) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [open, setOpen] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    if (open && dx > 0) {
      setOffset(Math.min(0, -threshold + dx));
    } else if (!open && dx < 0) {
      setOffset(Math.max(-120, dx));
    } else if (open && dx > threshold) {
      setOffset(0);
      setOpen(false);
    }
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offset < -threshold) {
      setOffset(-threshold);
      setOpen(true);
    } else {
      setOffset(0);
      setOpen(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className ?? ''}`}>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-[var(--color-danger)] text-white px-5 font-semibold text-sm"
        style={{ width: threshold + 20 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-full h-full flex items-center justify-center gap-1.5 active:opacity-80"
        >
          🗑 {deleteLabel}
        </button>
      </div>
      <div
        className="relative bg-[var(--color-surface-card)] touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
