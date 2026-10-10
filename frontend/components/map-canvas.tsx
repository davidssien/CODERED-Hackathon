"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, Marker } from "mapbox-gl";
import type { LocationReport, Permit } from "@/lib/types";

interface MapCanvasProps {
  report: LocationReport | null;
  selectedPermit: Permit | null;
  onPermitSelect: (permit: Permit) => void;
}

function markerColor(level: Permit["impactLevel"]) {
  if (level === "high") return "#ef4444";
  if (level === "watch") return "#f59e0b";
  return "#10b981";
}

export default function MapCanvas({ report, selectedPermit, onPermitSelect }: MapCanvasProps) {
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

    map.current = instance;

    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !report) return;

    map.current.flyTo({
      center: [report.coordinates.longitude, report.coordinates.latitude],
      zoom: 11.4,
      duration: 2200,
      essential: true,
    });

    permitMarkers.current.forEach((marker) => marker.remove());
    permitMarkers.current = [];
    locationMarker.current?.remove();

    const locationElement = document.createElement("div");
    locationElement.className = "location-pin";
    locationElement.setAttribute("aria-label", "Searched location");
    locationMarker.current = new mapboxgl.Marker({ element: locationElement })
      .setLngLat([report.coordinates.longitude, report.coordinates.latitude])
      .addTo(map.current);

    report.permits.forEach((permit, index) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "permit-pin";
      element.style.setProperty("--pin-color", markerColor(permit.impactLevel));
      element.innerHTML = `<span>${index + 1}</span>`;
      element.setAttribute("aria-label", `Open ${permit.facilityName}`);
      element.onclick = () => callbackRef.current(permit);

      const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([permit.coordinates.longitude, permit.coordinates.latitude])
        .addTo(map.current!);

      permitMarkers.current.push(marker);
    });
  }, [report]);

  useEffect(() => {
    if (!map.current || !selectedPermit) return;
    map.current.easeTo({
      center: [selectedPermit.coordinates.longitude, selectedPermit.coordinates.latitude],
      zoom: Math.max(map.current.getZoom(), 12.2),
      duration: 900,
      offset: [-120, 0],
    });
  }, [selectedPermit]);

  const noToken = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="absolute inset-0 bg-[#f2f5f7]">
      <div ref={mapContainer} className="h-full w-full" />
      {noToken ? (
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#f2f5f7]">
          <div className="absolute h-[68vmin] w-[68vmin] min-h-[360px] min-w-[360px] rounded-full border border-slate-300 bg-[radial-gradient(circle_at_38%_30%,#ffffff_0,#e8eef1_45%,#cad5dc_100%)] shadow-[inset_-45px_-24px_90px_rgba(90,105,120,.16),0_35px_120px_rgba(31,41,55,.10)]" />
          <div className="relative max-w-xs rounded-2xl border border-slate-200 bg-white/90 p-4 text-center text-xs leading-5 text-slate-500 shadow-lg backdrop-blur">
            Add <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">NEXT_PUBLIC_MAPBOX_TOKEN</code> to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">.env.local</code> to render the interactive Mapbox globe.
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(15,23,42,.04)_100%)]" />
    </div>
  );
}
