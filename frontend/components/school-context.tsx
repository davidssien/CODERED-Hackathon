import type { SchoolContext } from "@/lib/types";

export default function SchoolContextView({ context, origin }: { context: SchoolContext; origin: string }) {
  return <section className="mt-5 rounded-2xl border border-slate-200 p-4">
    <h3 className="text-sm font-semibold">Demo school context</h3>
    <p className="mt-2 text-xs leading-5 text-slate-500">Distances from {origin}. Covers {context.sampleSize} sourced demo schools; this is a sample, not a complete school inventory.</p>
    {context.schools.length ? <ul className="mt-3 space-y-2">{context.schools.map(school => <li key={school.id} className="text-xs">
      <span className="font-semibold">{school.label}</span><span className="text-slate-500"> · {school.distanceMiles.toFixed(2)} miles</span>
    </li>)}</ul> : <p className="mt-3 text-xs text-slate-600">No schools in this sample within {context.radiusMiles} miles. Other schools may be nearby.</p>}
  </section>;
}
