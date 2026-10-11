"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import LocationSearch from "@/components/location-search";
import MapCanvas from "@/components/map-canvas";
import LocationPanel from "@/components/location-panel";
import PermitPanel from "@/components/permit-panel";
import Legend from "@/components/legend";
import { LocationPanelSkeleton } from "@/components/loading-states";
import { geocodeAddress, type GeocodeResult } from "@/lib/mapbox";
import { DEMO_LOCATIONS } from "@/lib/demo-locations";
import type { LocationReport, Permit } from "@/lib/types";

export default function PermitWatchApp() {
  const [report, setReport] = useState<LocationReport | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const loadLocation = async (query: string, preset?: GeocodeResult) => {
    const id = ++requestId.current;
    controller.current?.abort();
    controller.current = new AbortController();
    const signal = AbortSignal.any([controller.current.signal, AbortSignal.timeout(15000)]);
    setError(null);
    setLocationLoading(true);
    setReport(null);
    setSelectedPermit(null);
    try {
      const result = preset || await geocodeAddress(query, signal);
      const params = new URLSearchParams({ lat: String(result.coordinates.latitude), lng: String(result.coordinates.longitude), label: result.label });
      const response = await fetch(`/api/report?${params}`, { signal });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "The neighborhood report is unavailable. Please retry.");
      }
      const nextReport: LocationReport = await response.json();
      if (id === requestId.current) setReport(nextReport);
    } catch (searchError) {
      if (id !== requestId.current) return;
      setError(signal.aborted ? "The search took too long. Retry or choose a preset demo location."
        : searchError instanceof Error ? searchError.message : "Could not search that location.");
    } finally {
      if (id === requestId.current) setLocationLoading(false);
    }
  };
  const clearLocation = () => {
    ++requestId.current;
    controller.current?.abort();
    setReport(null);
    setSelectedPermit(null);
    setLocationLoading(false);
    setError(null);
  };
  const active = Boolean(report) || locationLoading;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-slate-100 text-slate-950">
      <MapCanvas report={report} selectedPermit={selectedPermit} onPermitSelect={setSelectedPermit} />
      {!active ? <header className="absolute left-6 top-6 z-20">
        <h1 className="text-2xl font-semibold">Permit Watch</h1>
        <p className="mt-1 text-sm text-slate-600">Discover · Understand · Act</p>
      </header> : null}
      <div className={["absolute z-40 transition-all duration-700",
        active ? "left-4 top-4 w-[calc(100%-2rem)] sm:left-5 sm:top-5 sm:w-[430px] lg:w-[min(430px,calc(100vw-500px))]"
          : "bottom-8 left-1/2 w-[min(560px,calc(100%-2rem))] -translate-x-1/2"].join(" ")}>
        <LocationSearch compact={active} loading={locationLoading} initialValue={report?.label || ""}
          onSearch={query => loadLocation(query)} onClear={clearLocation} />
        {active ? <button type="button" onClick={clearLocation} className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">Reset demo</button> : null}
        {error ? <div role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div> : null}
        {!active ? <div className="mt-3 rounded-2xl bg-white/95 p-3 shadow-panel">
          <p className="text-xs font-semibold text-slate-600">Try a sourced facility location · cached real data</p>
          <div className="mt-2 flex flex-wrap gap-2">{DEMO_LOCATIONS.map(preset => <button key={preset.label} type="button"
            onClick={() => loadLocation(preset.label, preset)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs hover:bg-slate-100">{preset.label}</button>)}</div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">Harris County concrete batch plants. Presets use facility addresses; arbitrary address/ZIP search requires Mapbox configuration.</p>
        </div> : null}
      </div>
      {report ? <Legend /> : null}
      <aside className={["absolute z-30 overflow-hidden border border-white/70 bg-white/95 shadow-panel backdrop-blur-2xl transition-all duration-700",
        active ? "bottom-0 right-0 h-[72dvh] w-full translate-y-0 rounded-t-[30px] opacity-100 sm:bottom-4 sm:right-4 sm:h-[calc(100dvh-2rem)] sm:w-[440px] sm:rounded-[30px] lg:w-[460px]"
          : "pointer-events-none bottom-4 right-4 h-[calc(100dvh-2rem)] w-[460px] translate-x-10 opacity-0"].join(" ")}>
        {locationLoading ? <LocationPanelSkeleton />
          : report && selectedPermit ? <PermitPanel permit={selectedPermit} onBack={() => setSelectedPermit(null)} />
          : report ? <LocationPanel report={report} onPermitSelect={setSelectedPermit} /> : null}
      </aside>
    </main>
  );
}
