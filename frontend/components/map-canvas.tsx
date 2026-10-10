"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map as MapboxMap, Marker } from "mapbox-gl";
import type { LocationReport, Permit } from "@/lib/types";

interface MapCanvasProps {
  report: LocationReport | null;
  selectedPermit: Permit | null;
  onPermitSelect: (permit: Permit) => void;
}

function markerColor(status: Permit["status"]) {
  return status === "pending" ? "#f59e0b" : "#64748b";
}

export default function MapCanvas({ report, selectedPermit, onPermitSelect }: MapCanvasProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapboxMap | null>(null);
  const permitMarkers = useRef<Marker[]>([]);
  const locationMarker = useRef<Marker | null>(null);
  const callbackRef = useRef(onPermitSelect);

  useEffect(() => {
    callbackRef.current = onPermitSelect;
  }, [onPermitSelect]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-28, 20],
      zoom: 1.65,
      projection: "globe",
      attributionControl: false,
      pitchWithRotate: false,
    });

    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    instance.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    instance.on("style.load", () => {
      instance.setFog({
        color: "rgb(240, 244, 248)",
        "high-color": "rgb(220, 228, 238)",
        "horizon-blend": 0.08,
        "space-color": "rgb(244, 247, 250)",
        "star-intensity": 0,
      });
    });

    instance.on("error", () => setMapError("The map is unavailable. Permit facts and nearby lists remain accessible."));
    instance.on("load", () => setMapError(null));
    map.current = instance;

    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.stop();
    permitMarkers.current.forEach(marker => marker.remove());
    permitMarkers.current = [];
    locationMarker.current?.remove();
    locationMarker.current = null;
    if (!report) {
      map.current.flyTo({ center: [-28, 20], zoom: 1.65, duration: 600 });
      return;
    }

    map.current.flyTo({
      center: [report.coordinates.longitude, report.coordinates.latitude],
      zoom: 11.4,
      duration: 2200,
      essential: true,
    });

    const locationElement = document.createElement("div");
    locationElement.className = "location-pin";
    locationElement.setAttribute("aria-label", "Searched location");
    locationMarker.current = new mapboxgl.Marker({ element: locationElement })
      .setLngLat([report.coordinates.longitude, report.coordinates.latitude])
      .addTo(map.current);

    report.permits.forEach((permit, index) => {
      if (permit.lat === null || permit.lng === null) return;
      const element = document.createElement("button");
      element.type = "button";
      element.className = "permit-pin";
      element.style.setProperty("--pin-color", markerColor(permit.status));
      element.innerHTML = `<span>${index + 1}</span>`;
      element.setAttribute("aria-label", `Open ${permit.name || permit.operator || "facility"}`);
      element.onclick = () => callbackRef.current(permit);

      const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([permit.lng, permit.lat])
        .addTo(map.current!);

      permitMarkers.current.push(marker);
    });
  }, [report]);

  useEffect(() => {
    if (!map.current || !selectedPermit || selectedPermit.lat === null || selectedPermit.lng === null) return;
    map.current.easeTo({
      center: [selectedPermit.lng, selectedPermit.lat],
      zoom: Math.max(map.current.getZoom(), 12.2),
      duration: 900,
      offset: [-120, 0],
    });
  }, [selectedPermit]);

  const noToken = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="absolute inset-0 bg-[#f2f5f7]">
      <div ref={mapContainer} className="h-full w-full" />
      {mapError ? <div role="status" className="absolute left-5 top-24 max-w-xs rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{mapError}</div> : null}
      {noToken ? (
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#f2f5f7]">
          <div className="absolute h-[68vmin] w-[68vmin] min-h-[360px] min-w-[360px] rounded-full border border-slate-300 bg-[radial-gradient(circle_at_38%_30%,#ffffff_0,#e8eef1_45%,#cad5dc_100%)] shadow-[inset_-45px_-24px_90px_rgba(90,105,120,.16),0_35px_120px_rgba(31,41,55,.10)]" />
          <div className="relative max-w-xs rounded-2xl border border-slate-200 bg-white/90 p-4 text-center text-xs leading-5 text-slate-500 shadow-lg backdrop-blur">
            Interactive map unavailable. Choose a preset location to explore cached permit facts and distances in the report.
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(15,23,42,.04)_100%)]" />
    </div>
  );
}
