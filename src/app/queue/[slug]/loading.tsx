export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0c1825] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-white/40 text-sm">
          <div className="w-2 h-2 rounded-full bg-white/40 pulse-new" />
          <div className="w-2 h-2 rounded-full bg-white/40 pulse-new" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-white/40 pulse-new" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-white/30 text-xs mt-3 uppercase tracking-[0.3em]">Memuat antrean</p>
      </div>
    </div>
  );
}
