'use client';

import { useEffect, useState } from 'react';

interface NumberFlipProps {
  value: string | number;
  className?: string;
  duration?: number;
}

export function NumberFlip({ value, className, duration = 500 }: NumberFlipProps) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (displayed === value) return;
    const flipTimer = setTimeout(() => setFlipping(true), 0);
    const swapTimer = setTimeout(() => {
      setDisplayed(value);
      setFlipping(false);
    }, duration / 2);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(swapTimer);
    };
  }, [value, displayed, duration]);

  return (
    <span
      className={`inline-block tabular-nums ${className ?? ''}`}
      style={{
        animation: flipping ? `flipOut ${duration / 2}ms ease-in` : `flipIn ${duration / 2}ms ease-out`,
        transformStyle: 'preserve-3d',
      }}
    >
      {displayed}
      <style jsx>{`
        @keyframes flipOut {
          0% { transform: rotateX(0); opacity: 1; }
          100% { transform: rotateX(-90deg); opacity: 0; }
        }
        @keyframes flipIn {
          0% { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
