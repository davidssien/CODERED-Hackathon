"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import LocationSearch from "@/components/location-search";
import MapCanvas from "@/components/map-canvas";
import LocationPanel from "@/components/location-panel";
import PermitPanel from "@/components/permit-panel";
import Legend from "@/components/legend";
import { LocationPanelSkeleton } from "@/components/loading-states";
import { geocodeAddress, resolveMapboxBoundary } from "@/lib/mapbox";
import type { GeocodeResult, MapboxBoundary } from "@/lib/mapbox";
import { getMockLocationReport } from "@/lib/mock-data";
import type { LocationReport, Permit } from "@/lib/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PermitWatchApp() {
  const [report, setReport] = useState<LocationReport | null>(null);
  const [boundary, setBoundary] = useState<MapboxBoundary | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocation = async (query: string, resolvedLocation?: GeocodeResult) => {
    setError(null);
    setLocationLoading(true);
    setSelectedPermit(null);
    setBoundary(null);

    try {
      const result = resolvedLocation ?? (await geocodeAddress(query));
      const [boundaryResult] = await Promise.all([
        resolveMapboxBoundary(result),
        sleep(350),
      ]);

      setBoundary(boundaryResult);
      setReport(getMockLocationReport(result.label, result.coordinates.latitude, result.coordinates.longitude));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Could not search that location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const openPermit = async (permit: Permit) => {
    setSelectedPermit(permit);
    setAnalysisLoading(true);
    await sleep(700);
    setAnalysisLoading(false);
  };

  const clearLocation = () => {
    setReport(null);
    setBoundary(null);
    setSelectedPermit(null);
    setError(null);
  };

  const active = Boolean(report) || locationLoading;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-slate-100 text-slate-950">
      <MapCanvas
        report={report}
        boundary={boundary}
        selectedPermit={selectedPermit}
        onPermitSelect={openPermit}
      />

      <div
        className={[
          "absolute z-40 transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
          active
            ? "left-4 top-4 w-[calc(100%-2rem)] sm:left-5 sm:top-5 sm:w-[430px] lg:w-[min(430px,calc(100vw-500px))]"
            : "bottom-8 left-1/2 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 sm:bottom-10",
        ].join(" ")}
      >
        <LocationSearch
          compact={active}
          loading={locationLoading}
          initialValue={report?.label || ""}
          onSearch={searchLocation}
          onClear={clearLocation}
        />

        {error ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/95 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm backdrop-blur">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}
      </div>

      {report ? <Legend /> : null}

      <aside
        className={[
          "absolute z-30 overflow-hidden border border-white/70 bg-white/94 shadow-panel backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
          active
            ? "bottom-0 right-0 h-[72dvh] w-full translate-y-0 rounded-t-[30px] opacity-100 sm:bottom-4 sm:right-4 sm:h-[calc(100dvh-2rem)] sm:w-[440px] sm:rounded-[30px] lg:w-[460px]"
            : "pointer-events-none bottom-4 right-4 h-[calc(100dvh-2rem)] w-[460px] translate-x-10 opacity-0",
        ].join(" ")}
      >
        {locationLoading ? (
          <LocationPanelSkeleton />
        ) : report && selectedPermit ? (
          <PermitPanel permit={selectedPermit} loading={analysisLoading} onBack={() => setSelectedPermit(null)} />
        ) : report ? (
          <LocationPanel report={report} onPermitSelect={openPermit} />
        ) : null}
      </aside>
    </main>
  );
}
