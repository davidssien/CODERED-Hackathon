"use client";
import { CalendarClock, ChevronRight, MapPin } from "lucide-react";
import SchoolContextView from "@/components/school-context";
import type { LocationReport, Permit } from "@/lib/types";

export default function LocationPanel({ report, onPermitSelect }: {
  report: LocationReport; onPermitSelect: (permit: Permit) => void;
}) {
  const pending = report.permits.filter(p => p.status === "pending");
  const existing = report.permits.filter(p => p.status === "existing");
  const list = (permits: Permit[]) => permits.map(permit => (
    <button key={permit.id} type="button" onClick={() => onPermitSelect(permit)}
      className="mb-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{permit.name || permit.operator || "Unnamed facility"}</div>
          <div className="mt-1 text-xs text-slate-500">
            {permit.distanceMiles === null ? "Distance unavailable" : `${permit.distanceMiles.toFixed(2)} mi away`}
            {" · "}{permit.permitType || "Permit type unavailable"}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      {permit.status === "pending" ? <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarClock className="h-3.5 w-3.5" />
        {permit.commentDeadline ? `Comment deadline: ${permit.commentDeadline}` : "Comment deadline unavailable — check official notice"}
      </div> : null}
      {permit.locationSource === "manual" ? <p className="mt-2 text-xs text-amber-700">Approximate manually entered location</p> : null}
    </button>
  ));
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-5 pb-5 pt-5 sm:px-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><MapPin className="h-4 w-4" /> Neighborhood context</div>
        <h1 className="text-xl font-semibold">{report.label}</h1>
        <div className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">Cached TCEQ data · {report.datasetCount} records in Harris County</div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <caption className="bg-slate-950 p-3 text-left font-semibold text-white">Concrete batch plant records within each radius</caption>
            <thead className="bg-slate-50"><tr><th className="p-3">Radius</th><th className="p-3">Existing</th><th className="p-3">Pending applications</th></tr></thead>
            <tbody>{report.metrics.map(m => <tr key={m.radiusMiles} className="border-t border-slate-100">
              <th className="p-3">{m.radiusMiles} mi</th><td className="p-3">{m.existing}</td><td className="p-3">{m.pending}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Straight-line distances. Counts describe this dataset, not all industry or health risk. Applications can concern facilities already operating; the two columns may overlap.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <SchoolContextView context={report.schoolContext} origin="your selected location" />
        <div className="mt-5" />
        <h2 className="mb-3 text-sm font-semibold">Pending applications within 5 miles ({pending.length})</h2>
        {pending.length ? list(pending) : <p className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No pending permits within 5 miles in this dataset. This does not establish that no applications exist.</p>}
        <h2 className="mb-3 mt-5 text-sm font-semibold">Existing facility records within 5 miles ({existing.length})</h2>
        {existing.length ? list(existing) : <p className="text-sm text-slate-500">No existing facilities within 5 miles in this dataset.</p>}
        {report.unlocatedPermits.length ? <details className="mt-5 text-sm">
          <summary className="cursor-pointer font-semibold">{report.unlocatedPermits.length} county records without coordinates</summary>
          <p className="my-3 text-xs text-slate-500">These records are excluded from nearby counts and distances.</p>
          {list(report.unlocatedPermits)}
        </details> : null}
      </div>
      <div className="border-t border-slate-200 px-5 py-3 text-[10px] leading-4 text-slate-500">
        Dataset generated {new Date(report.generatedAt).toLocaleString()}. Cached source information may lag current permit status.
      </div>
    </div>
  );
}
