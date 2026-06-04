'use client';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const palette = [
  { bg: '#fed7aa', text: '#9a3412' },
  { bg: '#fbcfe8', text: '#9d174d' },
  { bg: '#a5f3fc', text: '#155e75' },
  { bg: '#bbf7d0', text: '#166534' },
  { bg: '#ddd6fe', text: '#5b21b6' },
  { bg: '#fde68a', text: '#92400e' },
  { bg: '#fecaca', text: '#991b1b' },
  { bg: '#c7d2fe', text: '#3730a3' },
  { bg: '#99f6e4', text: '#115e59' },
  { bg: '#f5d0fe', text: '#86198f' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 36, className = '' }: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex = hashString(name) % palette.length;
  const { bg, text } = palette[colorIndex];

  return (
    <div
      className={`inline-flex items-center justify-center font-display font-bold shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: bg,
        color: text,
        fontSize: size * 0.4,
        letterSpacing: '-0.02em',
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
