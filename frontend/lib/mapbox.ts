import type { Coordinates } from "@/lib/types";

export type GeocodeFeatureType =
  | "country"
  | "region"
  | "postcode"
  | "district"
  | "place"
  | "locality"
  | "neighborhood"
  | "street"
  | "address"
  | "secondary_address";

export interface GeocodeResult {
  label: string;
  coordinates: Coordinates;
  featureType?: GeocodeFeatureType;
  bbox?: [number, number, number, number];
}

export interface LocationSuggestion extends GeocodeResult {
  id: string;
  name: string;
  description: string;
}

export type BoundaryLevel = "adm0" | "adm1" | "adm2" | "loc2" | "loc3" | "loc4";

export interface BoundaryLayerDefinition {
  level: BoundaryLevel;
  label: string;
  tilesetId: string;
  sourceId: string;
  sourceLayer: string;
  minZoom: number;
}

export interface MapboxBoundary {
  mapboxId: string;
  level: BoundaryLevel;
  label: string;
  bbox?: [number, number, number, number];
  source?: "mapbox" | "geojson";
  geojson?: unknown;
}

export const MAPBOX_BOUNDARY_LAYERS: readonly BoundaryLayerDefinition[] = [
  {
    level: "adm0",
    label: "Country",
    tilesetId: "mapbox.boundaries-adm0-v4_7",
    sourceId: "mapbox-boundary-adm0",
    sourceLayer: "boundaries_admin_0",
    minZoom: 0,
  },
  {
    level: "adm1",
    label: "State / Region",
    tilesetId: "mapbox.boundaries-adm1-v4_7",
    sourceId: "mapbox-boundary-adm1",
    sourceLayer: "boundaries_admin_1",
    minZoom: 3,
  },
  {
    level: "adm2",
    label: "County / District",
    tilesetId: "mapbox.boundaries-adm2-v4_7",
    sourceId: "mapbox-boundary-adm2",
    sourceLayer: "boundaries_admin_2",
    minZoom: 5.5,
  },
  {
    level: "loc2",
    label: "City / Town",
    tilesetId: "mapbox.boundaries-loc2-v4_7",
    sourceId: "mapbox-boundary-loc2",
    sourceLayer: "boundaries_locality_2",
    minZoom: 7,
  },
  {
    level: "loc3",
    label: "District / Quarter",
    tilesetId: "mapbox.boundaries-loc3-v4_7",
    sourceId: "mapbox-boundary-loc3",
    sourceLayer: "boundaries_locality_3",
    minZoom: 10,
  },
  {
    level: "loc4",
    label: "Neighborhood",
    tilesetId: "mapbox.boundaries-loc4-v4_7",
    sourceId: "mapbox-boundary-loc4",
    sourceLayer: "boundaries_locality_4",
    minZoom: 12.5,
  },
];

interface MapboxFeature {
  id?: string;
  bbox?: [number, number, number, number];
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    mapbox_id?: string;
    feature_type?: GeocodeFeatureType;
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
  };
}

interface TilequeryFeature {
  id?: string | number;
  properties?: {
    mapbox_id?: string;
    worldview?: string;
    tilequery?: {
      layer?: string;
      geometry?: string;
      distance?: number;
    };
  };
}

function featureToGeocodeResult(feature: MapboxFeature, fallback: string): GeocodeResult | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates) return null;

  const [longitude, latitude] = coordinates;
  const properties = feature.properties ?? {};

  return {
    label: properties.full_address || properties.name_preferred || properties.name || fallback,
    coordinates: { latitude, longitude },
    featureType: properties.feature_type,
    bbox: feature.bbox,
  };
}

function boundaryCandidates(featureType?: GeocodeFeatureType): BoundaryLevel[] {
  if (featureType === "country") return ["adm0"];
  if (featureType === "region") return ["adm1"];
  if (featureType === "district") return ["adm2"];
  if (featureType === "place") return ["loc2"];
  if (featureType === "locality") return ["loc3", "loc2"];
  if (featureType === "neighborhood") return ["loc4", "loc3", "loc2"];

  return ["loc4", "loc3", "loc2", "adm2", "adm1", "adm0"];
}

export async function getLocationSuggestions(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const value = query.trim();

  if (!token || value.length < 2) return [];

  const params = new URLSearchParams({
    q: value,
    access_token: token,
    limit: "6",
    country: "us",
    autocomplete: "true",
    types: "address,street,neighborhood,locality,place,district,postcode,region,country",
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error("Mapbox could not load location suggestions.");
  }

  const data = await response.json();
  const features = (data.features ?? []) as MapboxFeature[];

  return features.flatMap((feature, index) => {
    const result = featureToGeocodeResult(feature, value);
    if (!result) return [];

    const properties = feature.properties ?? {};
    const name = properties.name_preferred || properties.name || result.label;
    const description = properties.place_formatted || properties.full_address || result.label;

    return [
      {
        id: properties.mapbox_id || feature.id || `${result.label}-${index}`,
        name,
        description,
        ...result,
      },
    ];
  });
}

type CensusBoundaryScope = "state" | "county" | "place" | "postcode";

function censusScopeForFeatureType(featureType?: GeocodeFeatureType): CensusBoundaryScope | null {
  if (featureType === "region") return "state";
  if (featureType === "district") return "county";
  if (featureType === "postcode") return "postcode";

  if (
    !featureType ||
    ["place", "locality", "neighborhood", "street", "address", "secondary_address"].includes(
      featureType,
    )
  ) {
    return "place";
  }

  return null;
}

function boundaryLevelForScope(scope: CensusBoundaryScope): BoundaryLevel {
  if (scope === "state") return "adm1";
  if (scope === "county") return "adm2";
  if (scope === "postcode") return "loc3";
  return "loc2";
}

async function resolveCensusBoundary(
  location: GeocodeResult,
  scope: CensusBoundaryScope,
): Promise<MapboxBoundary | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(location.coordinates.latitude),
      longitude: String(location.coordinates.longitude),
      scope,
    });

    const response = await fetch(`/api/boundary?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.featureCollection?.features?.length) return null;

    return {
      mapboxId: `census:${scope}:${data.geoid ?? "boundary"}`,
      level: boundaryLevelForScope(scope),
      label: data.name || scope,
      bbox: data.bbox ?? location.bbox,
      source: "geojson",
      geojson: data.featureCollection,
    };
  } catch {
    return null;
  }
}

export async function resolveMapboxBoundary(location: GeocodeResult): Promise<MapboxBoundary | null> {
  // Match the boundary size to what the user searched:
  // region -> state, district -> county, place/locality -> city/town,
  // postcode -> ZIP area, address/street/neighborhood -> containing city.
  const censusScope = censusScopeForFeatureType(location.featureType);

  if (censusScope) {
    const scopedBoundary = await resolveCensusBoundary(location, censusScope);
    if (scopedBoundary) return scopedBoundary;
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return censusScope ? resolveCensusBoundary(location, censusScope) : null;
  }

  const candidates = boundaryCandidates(location.featureType);
  const definitions = candidates
    .map((level) => MAPBOX_BOUNDARY_LAYERS.find((item) => item.level === level))
    .filter((item): item is BoundaryLayerDefinition => Boolean(item));

  if (definitions.length === 0) {
    return censusScope ? resolveCensusBoundary(location, censusScope) : null;
  }

  const tilesets = definitions.map((item) => item.tilesetId).join(",");
  const { longitude, latitude } = location.coordinates;
  const params = new URLSearchParams({
    access_token: token,
    geometry: "polygon",
    limit: "30",
    dedupe: "true",
  });

  const response = await fetch(
    `https://api.mapbox.com/v4/${tilesets}/tilequery/${longitude},${latitude}.json?${params.toString()}`,
  );

  if (!response.ok) {
    // Mapbox Boundaries is separately permissioned. Fall back to the current
    // U.S. Census TIGERweb place polygon so city searches still get a real
    // municipal outline on the Mapbox map.
    return censusScope ? resolveCensusBoundary(location, censusScope) : null;
  }

  const data = await response.json();
  const features = (data.features ?? []) as TilequeryFeature[];

  for (const definition of definitions) {
    const feature = features.find((item) => {
      const properties = item.properties;
      const worldview = properties?.worldview;
      return (
        properties?.tilequery?.layer === definition.sourceLayer &&
        (!worldview || worldview === "all" || worldview === "US")
      );
    });

    if (!feature) continue;

    const mapboxId = feature.properties?.mapbox_id || (feature.id != null ? String(feature.id) : "");
    if (!mapboxId) continue;

    return {
      mapboxId,
      level: definition.level,
      label: definition.label,
      bbox: location.bbox,
      source: "mapbox",
    };
  }

  return censusScope ? resolveCensusBoundary(location, censusScope) : null;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    // Keeps the demo usable before the Mapbox key is added.
    return {
      label: query || "Houston, Texas",
      coordinates: { latitude: 29.7604, longitude: -95.3698 },
      featureType: "place",
    };
  }

  const params = new URLSearchParams({
    q: query,
    access_token: token,
    limit: "1",
    country: "us",
    autocomplete: "false",
  });

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Mapbox could not search that address.");
  }

  const data = await response.json();
  const feature = (data.features?.[0] ?? null) as MapboxFeature | null;

  if (!feature) {
    throw new Error("No matching address found.");
  }

  const result = featureToGeocodeResult(feature, query);
  if (!result) {
    throw new Error("That location did not include valid coordinates.");
  }

  return result;
}
