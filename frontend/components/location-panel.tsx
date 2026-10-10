"use client";

import { ArrowUpRight, CalendarClock, ChevronRight, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import type { ImpactLevel, LocationReport, Permit } from "@/lib/types";

const levelStyles: Record<ImpactLevel, string> = {
  high: "bg-rose-50 text-rose-700 ring-rose-200",
  watch: "bg-amber-50 text-amber-700 ring-amber-200",
  info: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function daysUntil(date: string) {
  const end = new Date(`${date}T23:59:59`);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

interface LocationPanelProps {
  report: LocationReport;
  onPermitSelect: (permit: Permit) => void;
}

export default function LocationPanel({ report, onPermitSelect }: LocationPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200/80 px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-slate-500">
              <MapPin className="h-4 w-4" /> Location report
            </div>
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950">{report.label}</h1>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Demo data</span>
        </div>

        <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-white/55">Neighborhood condition</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">{report.score}</span>
                <span className="text-sm text-white/45">/100</span>
              </div>
            </div>
            <div className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">{report.scoreLabel}</div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/72">{report.summary}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">{metric.label}</span>
                <span className="text-sm font-bold text-slate-950">{metric.value}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${metric.value}%` }} />
              </div>
              <div className="mt-2 text-[10px] leading-4 text-slate-400">{metric.helper}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-xs leading-5 text-slate-600">{report.environmentalImpact}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              Pending permits
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{report.permits.length}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">Ranked by estimated impact + deadline</div>
          </div>
          <Sparkles className="h-4 w-4 text-slate-400" />
        </div>

        <div className="space-y-2.5 pb-6">
          {report.permits.map((permit, index) => (
            <button
              type="button"
              key={permit.id}
              onClick={() => onPermitSelect(permit)}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-bold text-white">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-950">{permit.facilityName}</div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-400">{permit.distanceMiles.toFixed(1)} mi away · {permit.type}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${levelStyles[permit.impactLevel]}`}>
                      {permit.impactScore}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {daysUntil(permit.commentDeadline)} days to comment
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      AI estimate <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/90 px-5 py-3 text-[10px] leading-4 text-slate-400 sm:px-6">
        Frontend demo only. Replace mock scoring with the live project datasets before presenting factual environmental claims.
      </div>
    </div>
  );
}
