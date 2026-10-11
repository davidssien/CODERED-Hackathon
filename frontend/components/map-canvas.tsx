"use client";

import { useEffect, useRef } from "react";
import mapboxgl, {
  Map as MapboxMap,
  Marker,
  type FilterSpecification,
  type LayerSpecification,
} from "mapbox-gl";
import type { LocationReport, Permit } from "@/lib/types";
import {
  MAPBOX_BOUNDARY_LAYERS,
  type MapboxBoundary,
} from "@/lib/mapbox";

interface MapCanvasProps {
  report: LocationReport | null;
  boundary: MapboxBoundary | null;
  selectedPermit: Permit | null;
  onPermitSelect: (permit: Permit) => void;
}

const WORLDVIEW_FILTER: FilterSpecification = [
  "any",
  ["==", "all", ["get", "worldview"]],
  ["in", "US", ["get", "worldview"]],
];

function selectedBoundaryFilter(mapboxId: string): FilterSpecification {
  return [
    "all",
    WORLDVIEW_FILTER,
    ["==", ["get", "mapbox_id"], mapboxId],
  ];
}

function markerColor(level: Permit["impactLevel"]) {
  if (level === "high") return "#ef4444";
  if (level === "watch") return "#f59e0b";
  return "#10b981";
}

function conditionPalette(score: number | null) {
  if (score == null) {
    return {
      fill: "#64748b",
      line: "#475569",
    };
  }

  if (score >= 75) {
    return {
      fill: "#22c55e",
      line: "#15803d",
    };
  }

  if (score >= 50) {
    return {
      fill: "#f59e0b",
      line: "#d97706",
    };
  }

  return {
    fill: "#ef4444",
    line: "#dc2626",
  };
}

function addLayerBelowLabels(instance: MapboxMap, layer: LayerSpecification) {
  const firstLabel = instance.getStyle().layers?.find((item) => item.type === "symbol")?.id;
  if (firstLabel) instance.addLayer(layer, firstLabel);
  else instance.addLayer(layer);
}

function ensureBoundaryLayers(instance: MapboxMap) {
  MAPBOX_BOUNDARY_LAYERS.forEach((definition) => {
    if (!instance.getSource(definition.sourceId)) {
      instance.addSource(definition.sourceId, {
        type: "vector",
        url: `mapbox://${definition.tilesetId}`,
        promoteId: "mapbox_id",
      });
    }

    const contextLayer = `${definition.sourceId}-context`;
    const fillLayer = `${definition.sourceId}-selected-fill`;
    const lineLayer = `${definition.sourceId}-selected-line`;

    if (!instance.getLayer(contextLayer)) {
      addLayerBelowLabels(instance, {
        id: contextLayer,
        type: "line",
        source: definition.sourceId,
        "source-layer": definition.sourceLayer,
        minzoom: definition.minZoom,
        filter: WORLDVIEW_FILTER,
        paint: {
          "line-color": "#64748b",
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            definition.minZoom,
            0.16,
            definition.minZoom + 2.5,
            0.42,
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            definition.minZoom,
            0.45,
            definition.minZoom + 4,
            1.15,
          ],
        },
      });
    }

    if (!instance.getLayer(fillLayer)) {
      addLayerBelowLabels(instance, {
        id: fillLayer,
        type: "fill",
        source: definition.sourceId,
        "source-layer": definition.sourceLayer,
        filter: selectedBoundaryFilter("__no_boundary__"),
        paint: {
          "fill-color": "#f59e0b",
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            Math.max(0, definition.minZoom - 1),
            0.08,
            definition.minZoom + 4,
            0.22,
          ],
        },
      });
    }

    if (!instance.getLayer(lineLayer)) {
      addLayerBelowLabels(instance, {
        id: lineLayer,
        type: "line",
        source: definition.sourceId,
        "source-layer": definition.sourceLayer,
        filter: selectedBoundaryFilter("__no_boundary__"),
        paint: {
          "line-color": "#d97706",
          "line-opacity": 0.95,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            Math.max(0, definition.minZoom - 1),
            2,
            definition.minZoom + 5,
            4,
          ],
        },
      });
    }
  });
}

function applyBoundarySelection(
  instance: MapboxMap,
  boundary: MapboxBoundary | null,
  score: number | null,
) {
  const palette = conditionPalette(score);

  MAPBOX_BOUNDARY_LAYERS.forEach((definition) => {
    const selected = boundary?.level === definition.level ? boundary.mapboxId : "__no_boundary__";
    const filter = selectedBoundaryFilter(selected);

    const contextLayer = `${definition.sourceId}-context`;
    const fillLayer = `${definition.sourceId}-selected-fill`;
    const lineLayer = `${definition.sourceId}-selected-line`;

    if (instance.getLayer(contextLayer)) {
      instance.setLayoutProperty(contextLayer, "visibility", boundary ? "visible" : "none");
    }
    if (instance.getLayer(fillLayer)) {
      instance.setFilter(fillLayer, filter);
      instance.setPaintProperty(fillLayer, "fill-color", palette.fill);
    }

    if (instance.getLayer(lineLayer)) {
      instance.setFilter(lineLayer, filter);
      instance.setPaintProperty(lineLayer, "line-color", palette.line);
    }
  });
}

export default function MapCanvas({ boundary, report, selectedPermit, onPermitSelect }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapboxMap | null>(null);
  const permitMarkers = useRef<Marker[]>([]);
  const locationMarker = useRef<Marker | null>(null);
  const callbackRef = useRef(onPermitSelect);
  const boundaryRef = useRef(boundary);
  const scoreRef = useRef<number | null>(report?.score ?? null);

  useEffect(() => {
    callbackRef.current = onPermitSelect;
  }, [onPermitSelect]);

  useEffect(() => {
    boundaryRef.current = boundary;
    scoreRef.current = report?.score ?? null;
  }, [boundary, report?.score]);

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

      if (boundaryRef.current) {
        ensureBoundaryLayers(instance);
        applyBoundarySelection(instance, boundaryRef.current, scoreRef.current);
      }
    });

    map.current = instance;

    return () => {
      permitMarkers.current.forEach((marker) => marker.remove());
      permitMarkers.current = [];
      locationMarker.current?.remove();
      locationMarker.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !instance.isStyleLoaded()) return;

    if (boundary) ensureBoundaryLayers(instance);
    applyBoundarySelection(instance, boundary, report?.score ?? null);
  }, [boundary, report?.score]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !report) return;

    if (boundary?.bbox) {
      const [west, south, east, north] = boundary.bbox;
      instance.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: { top: 90, right: 90, bottom: 90, left: 90 },
          maxZoom: 13,
          duration: 2200,
          essential: true,
        },
      );
    } else {
      const zoomByLevel: Partial<Record<MapboxBoundary["level"], number>> = {
        adm0: 3.4,
        adm1: 5.2,
        adm2: 8,
        loc2: 10.4,
        loc3: 12,
        loc4: 13.5,
      };

      instance.flyTo({
        center: [report.coordinates.longitude, report.coordinates.latitude],
        zoom: boundary ? zoomByLevel[boundary.level] ?? 11.4 : 11.4,
        duration: 2200,
        essential: true,
      });
    }

    permitMarkers.current.forEach((marker) => marker.remove());
    permitMarkers.current = [];
    locationMarker.current?.remove();

    const locationElement = document.createElement("div");
    locationElement.className = "location-pin";
    locationElement.setAttribute("aria-label", "Searched location");
    locationMarker.current = new mapboxgl.Marker({ element: locationElement })
      .setLngLat([report.coordinates.longitude, report.coordinates.latitude])
      .addTo(instance);

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
        .addTo(instance);

      permitMarkers.current.push(marker);
    });
  }, [boundary, report]);

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
