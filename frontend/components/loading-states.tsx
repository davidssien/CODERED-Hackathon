function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-soft-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function LocationPanelSkeleton() {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="space-y-4 border-b border-slate-200 pb-5">
        <Bar className="h-5 w-2/3" />
        <Bar className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Bar className="h-20 w-full rounded-2xl" />
          <Bar className="h-20 w-full rounded-2xl" />
          <Bar className="h-20 w-full rounded-2xl" />
          <Bar className="h-20 w-full rounded-2xl" />
        </div>
      </div>
      <div className="space-y-3 pt-5">
        <Bar className="h-4 w-1/2" />
        {[0, 1, 2, 3].map((item) => (
          <Bar key={item} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function PermitAnalysisSkeleton() {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <Bar className="h-5 w-1/2" />
      <Bar className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Bar className="h-20 rounded-2xl" />
        <Bar className="h-20 rounded-2xl" />
        <Bar className="h-20 rounded-2xl" />
      </div>
      <Bar className="h-36 w-full rounded-2xl" />
      <Bar className="h-28 w-full rounded-2xl" />
    </div>
  );
}
