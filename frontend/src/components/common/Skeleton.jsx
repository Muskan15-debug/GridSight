export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-block ${className}`} />;
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      <SkeletonBlock className="mb-4 h-4 w-24" />
      <SkeletonBlock className="h-8 w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="glass-card rounded-xl p-6 md:col-span-2">
        <SkeletonBlock className="mb-4 h-4 w-32" />
        <SkeletonBlock className="h-12 w-40" />
      </div>
      <div className="glass-card rounded-xl p-6 md:col-span-2">
        <SkeletonBlock className="mb-4 h-4 w-20" />
        <div className="flex flex-wrap justify-around gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="glass-card rounded-xl p-6 md:col-span-2">
        <SkeletonBlock className="mb-4 h-4 w-40" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
      <div className="glass-card rounded-xl p-6 md:col-span-2">
        <SkeletonBlock className="mb-3 h-4 w-48" />
        <SkeletonBlock className="h-6 w-full" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="glass-card rounded-xl p-6">
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </>
  );
}
