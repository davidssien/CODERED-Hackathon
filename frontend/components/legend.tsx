const items = [["Pending application", "bg-amber-500"], ["Existing facility record", "bg-slate-500"]] as const;
export default function Legend() {
  return <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden rounded-2xl bg-white/90 p-4 shadow-panel md:block">
    <div className="mb-3 text-xs font-semibold">Cached concrete plant records</div>
    {items.map(([label, color]) => <div key={label} className="mt-2 flex items-center gap-2 text-xs text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</div>)}
  </div>;
}
