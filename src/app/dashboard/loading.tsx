export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 skeleton-pulse rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-5 skeleton-pulse rounded w-32" />
          <div className="h-3 skeleton-pulse rounded w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bento p-4 h-24 skeleton-pulse rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
      <div className="bento p-4 h-64 skeleton-pulse rounded-xl" />
    </div>
  );
}
