"use client";

import { ArrowLeft, Calendar, FileText, Gauge, MapPin, Sparkles, TriangleAlert } from "lucide-react";
import type { Permit } from "@/lib/types";

interface PermitPanelProps {
  permit: Permit;
  loading: boolean;
  onBack: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
};

export default function PermitPanel({ permit, loading, onBack }: PermitPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200/80 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to location
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-violet-600">
              <Sparkles className="h-4 w-4" /> AI estimate
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{permit.facilityName}</h2>
            <p className="mt-1 text-xs text-slate-400">{permit.permitNumber} · {permit.operator}</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
            <div className="text-[9px] uppercase tracking-wider text-white/50">Impact</div>
            <div className="text-xl font-bold">{permit.impactScore}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <section>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Description</div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm leading-6 text-slate-700">{permit.summary}</p>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Environmental impact</div>
            <div className="text-xs font-semibold text-slate-700">{permit.impactScore}/100</div>
          </div>
          <div className="overflow-hidden rounded-full bg-slate-100">
            <div className="h-2.5 rounded-full bg-slate-950 transition-all duration-700" style={{ width: `${permit.impactScore}%` }} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {permit.reasons.map((reason) => (
              <div key={reason} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-semibold leading-4 text-slate-600">
                {reason}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-violet-50 p-5 ring-1 ring-inset ring-violet-100">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
            <Sparkles className="h-4 w-4" /> AI reading
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-soft-pulse rounded bg-violet-200/70" />
              <div className="h-3 w-[92%] animate-soft-pulse rounded bg-violet-200/70" />
              <div className="h-3 w-[78%] animate-soft-pulse rounded bg-violet-200/70" />
            </div>
          ) : (
            <p className="text-sm leading-6 text-violet-950/80">{permit.aiEstimate}</p>
          )}
        </section>

        <section className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Modeled emissions</div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {permit.pollutants.map((pollutant, index) => (
              <div key={pollutant.name} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-xs ${index ? "border-t border-slate-100" : ""}`}>
                <span className="font-semibold text-slate-800">{pollutant.name}</span>
                <span className="text-slate-500">{pollutant.tonsPerYear} t/yr</span>
                <span className="rounded-full bg-rose-50 px-2 py-1 font-semibold text-rose-600">+{pollutant.changeTonsPerYear}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Calendar className="mb-2 h-4 w-4 text-slate-400" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date proposed</div>
            <div className="mt-1 text-xs font-semibold text-slate-800">{formatDate(permit.dateProposed)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <TriangleAlert className="mb-2 h-4 w-4 text-slate-400" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comment deadline</div>
            <div className="mt-1 text-xs font-semibold text-slate-800">{formatDate(permit.commentDeadline)}</div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100"><FileText className="h-5 w-5 text-slate-500" /></div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Permit notice PDF</div>
                <div className="text-[11px] text-slate-400">Connect the scraper&apos;s notice URL here</div>
              </div>
            </div>
            {permit.noticeUrl ? (
              <a href={permit.noticeUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Open</a>
            ) : (
              <button disabled className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">Not linked</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
