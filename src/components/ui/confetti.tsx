'use client';

import { useEffect, useState, useRef } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  count?: number;
  onComplete?: () => void;
}

const colors = ['#047857', '#b45309', '#0e7490', '#be185d', '#facc15', '#7c3aed'];

function createPiece(i: number, w: number): ConfettiPiece {
  const angle = (Math.random() * 60 - 30 - 90) * (Math.PI / 180);
  const speed = 6 + Math.random() * 6;
  const shapes: ('square' | 'circle' | 'triangle')[] = ['square', 'circle', 'triangle'];
  return {
    id: i,
    x: w / 2 + (Math.random() - 0.5) * 80,
    y: 40,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 6,
    shape: shapes[i % shapes.length],
  };
}

export function Confetti({ active, duration = 1800, count = 60, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [running, setRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const w = containerRef.current?.offsetWidth ?? 400;
    const initial = Array.from({ length: count }, (_, i) => createPiece(i, w));
    setPieces(initial);
    setRunning(true);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed > duration) {
        setRunning(false);
        setPieces([]);
        onComplete?.();
        return;
      }
      setPieces((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.35,
          rotation: p.rotation + p.rotationSpeed,
        }))
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, count, duration, onComplete]);

  if (!running && pieces.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-50"
      aria-hidden
    >
      {pieces.map((p) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          backgroundColor: p.shape === 'square' ? p.color : 'transparent',
          borderRadius: p.shape === 'circle' ? '50%' : '0',
          transform: `rotate(${p.rotation}deg)`,
          borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
          borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
          borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
        };
        return <div key={p.id} style={style} />;
      })}
    </div>
  );
}
