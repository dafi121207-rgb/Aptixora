export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="h-8 skeleton-pulse rounded w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 skeleton-pulse rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  );
}
