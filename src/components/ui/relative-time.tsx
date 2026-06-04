'use client';

import { useEffect, useState } from 'react';

interface RelativeTimeProps {
  iso: string;
  className?: string;
  prefix?: string;
}

function diffParts(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 5) return { value: 'baru saja', unit: 's', seconds };
  if (seconds < 60) return { value: `${seconds}`, unit: 'detik', seconds };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { value: `${minutes}`, unit: 'menit', seconds };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: `${hours}`, unit: 'jam', seconds };
  const days = Math.floor(hours / 24);
  if (days < 30) return { value: `${days}`, unit: 'hari', seconds };
  const months = Math.floor(days / 30);
  if (months < 12) return { value: `${months}`, unit: 'bulan', seconds };
  const years = Math.floor(months / 12);
  return { value: `${years}`, unit: 'tahun', seconds };
}

export function RelativeTime({ iso, className, prefix = '' }: RelativeTimeProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => {
      const { seconds } = diffParts(iso);
      let ms = 5000;
      if (seconds < 60) ms = 5000;
      else if (seconds < 3600) ms = 30000;
      else if (seconds < 86400) ms = 60000;
      else ms = 300000;
      setTimeout(() => setTick((t) => t + 1), ms);
    };
    update();
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [iso, tick]);

  const { value, unit } = diffParts(iso);
  const text = unit === 's' ? value : `${value} ${unit}`;
  return (
    <span className={className} title={new Date(iso).toLocaleString('id-ID')}>
      {prefix}{text}
    </span>
  );
}
