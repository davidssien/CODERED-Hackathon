const permitItems = [
  ["High impact", "bg-rose-500"],
  ["Watch", "bg-amber-500"],
  ["Lower impact", "bg-emerald-500"],
] as const;

const conditionItems = [
  ["Good area condition", "bg-emerald-500"],
  ["Watch area condition", "bg-amber-500"],
  ["Poor area condition", "bg-rose-500"],
] as const;

export default function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden rounded-2xl border border-white/60 bg-white/88 p-4 shadow-panel backdrop-blur-xl md:block">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Area condition</div>
      <div className="space-y-2">
        {conditionItems.map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-slate-200" />

      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Permit impact</div>
      <div className="space-y-2">
        {permitItems.map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] leading-4 text-slate-400">
        Area colors use demo scoring until live environmental datasets are connected.
      </div>
    </div>
  );
}
