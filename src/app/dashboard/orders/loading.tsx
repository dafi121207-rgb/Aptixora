export default function Loading() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-8 skeleton-pulse rounded w-48" />
        <div className="h-4 skeleton-pulse rounded w-32" />
      </div>
      <div className="bento p-3 sm:p-4 h-12 skeleton-pulse rounded-lg" />
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 skeleton-pulse rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
