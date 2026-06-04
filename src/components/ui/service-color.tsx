const palette = [
  { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
  { bg: '#fbcfe8', text: '#9d174d', border: '#ec4899' },
  { bg: '#a5f3fc', text: '#155e75', border: '#06b6d4' },
  { bg: '#bbf7d0', text: '#166534', border: '#22c55e' },
  { bg: '#ddd6fe', text: '#5b21b6', border: '#8b5cf6' },
  { bg: '#fde68a', text: '#92400e', border: '#eab308' },
  { bg: '#fecaca', text: '#991b1b', border: '#ef4444' },
  { bg: '#c7d2fe', text: '#3730a3', border: '#6366f1' },
  { bg: '#99f6e4', text: '#115e59', border: '#14b8a6' },
  { bg: '#f5d0fe', text: '#86198f', border: '#d946ef' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function serviceColor(name: string) {
  return palette[hash(name) % palette.length];
}

export function ServiceColorTag({ name, className }: { name: string; className?: string }) {
  const c = serviceColor(name);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${className ?? ''}`}
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderLeft: `3px solid ${c.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: c.border }}
      />
      {name}
    </span>
  );
}
