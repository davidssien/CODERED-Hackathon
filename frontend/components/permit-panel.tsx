"use client";
import { useEffect, useState } from "react";
import SchoolContextView from "@/components/school-context";
import PermitActions from "@/components/permit-actions";
import { ArrowLeft, FileText } from "lucide-react";
import type { Coordinates, Permit } from "@/lib/types";

export default function PermitPanel({ permit: initialPermit, location, onBack }: { permit: Permit; location: Coordinates; onBack: () => void }) {
  const [detail, setDetail] = useState(initialPermit);
  const [detailError, setDetailError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    fetch(`/api/permits/${encodeURIComponent(initialPermit.id)}?${params}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then(async response => {
      if (!response.ok) throw new Error("Permit details are temporarily unavailable. Showing cached report facts.");
      const body = await response.json();
      if (!controller.signal.aborted) setDetail(body.permit);
    }).catch(() => {
      if (!controller.signal.aborted) setDetailError("Permit details are temporarily unavailable. Showing cached report facts.");
    });
    return () => controller.abort();
  }, [initialPermit.id, location.latitude, location.longitude]);
  const permit = detail;

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
        {detailError ? <p role="status" className="mt-4 text-xs text-amber-700">{detailError}</p> : null}
        {permit.lat === null || permit.lng === null ? <p className="mt-4 text-xs text-slate-500">School distances are unavailable because the facility has no coordinates.</p>
          : permit.schoolContext ? <SchoolContextView context={permit.schoolContext} origin="this facility" /> : null}
        <PermitActions key={permit.id} permitId={permit.id} />
        <p className="mt-5 text-xs leading-5 text-slate-500">Proximity alone does not establish health effects.</p>
      </div>
    </div>
  );
}
