"use client";
import { ArrowLeft, FileText } from "lucide-react";
import type { Permit } from "@/lib/types";

export default function PermitPanel({ permit, onBack }: { permit: Permit; onBack: () => void }) {
  const fields = [
    ["Status in cached dataset", permit.status === "pending" ? "Pending application" : "Existing facility record"],
    ["Permit number", permit.permitNumber],
    ["Application type", permit.permitType],
    ["Operator", permit.operator],
    ["Address", [permit.address, permit.city, permit.zip].filter(Boolean).join(", ") || null],
    ["Distance", permit.distanceMiles === null ? null : `${permit.distanceMiles.toFixed(2)} miles (straight line)`],
    ["Application received", permit.dateReceived],
    ["Comment deadline", permit.commentDeadline],
    ["Production rate", permit.productionRate],
  ];
  const sourceUrl = permit.noticeUrl && /^https:\/\//i.test(permit.noticeUrl) ? permit.noticeUrl : null;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-5 pb-4 pt-5 sm:px-6">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" /> Back to location</button>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Permit facts</div>
        <h2 className="text-xl font-semibold">{permit.name || permit.operator || "Unnamed facility"}</h2>
        <p className="mt-2 text-xs text-slate-500">Concrete batch plant · cached source record</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <dl className="rounded-3xl border border-slate-200 bg-white p-5">
          {fields.map(([label, value]) => <div key={label} className="mb-4 last:mb-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm text-slate-800">{value || "Unavailable in source data"}</dd>
          </div>)}
        </dl>
        {permit.status === "pending" && !permit.commentDeadline ? <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">No verified comment deadline is available. Pending application status does not mean the comment window is open. Check the official notice before preparing a response.</p> : null}
        {permit.locationSource === "manual" || permit.notes ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">{permit.notes || "Coordinates were entered manually and may be approximate."}</p> : null}
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Permitted emissions</h3>
          {permit.emissions.length ? <div className="rounded-2xl border border-slate-200 p-4">
            {permit.emissions.map((e, i) => <p key={i} className="text-sm">{e.pollutant}: {e.tonsPerYear} tons/year</p>)}
            <p className="mt-2 text-xs text-slate-500">Permitted quantities are not actual measured emissions.</p>
          </div> : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Emission quantities are unavailable. Missing data does not mean zero emissions.</p>}
        </section>
        <section className="mt-5 rounded-3xl border border-slate-200 p-4">
          <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-slate-500" /><h3 className="text-sm font-semibold">Official source</h3></div>
          {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white">Open official source</a>
            : <p className="mt-3 text-xs text-slate-500">Source link unavailable.</p>}
          <p className="mt-3 text-xs text-slate-500">If the source is temporarily unavailable, these cached facts remain accessible. Verify current status with TCEQ.</p>
        </section>
        <p className="mt-5 text-xs leading-5 text-slate-500">Plain-language AI explanations and editable comment drafting are not connected yet. Proximity alone does not establish health effects.</p>
      </div>
    </div>
  );
}
