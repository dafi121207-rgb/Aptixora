'use client';

import { useEffect, useState } from 'react';

interface LiveClockProps {
  showSeconds?: boolean;
  className?: string;
  format?: '12' | '24';
}

export function LiveClock({ showSeconds = true, className, format = '24' }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  if (!now) return <span className={className}>--:--</span>;

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hStr = format === '12'
    ? (h % 12 || 12).toString().padStart(2, '0')
    : h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  const ampm = format === '12' ? (h < 12 ? 'AM' : 'PM') : '';

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {hStr}:{mStr}{showSeconds ? `:${sStr}` : ''} {ampm}
    </span>
  );
}
