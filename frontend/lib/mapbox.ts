import type { Coordinates } from "@/lib/types";

export interface GeocodeResult {
  label: string;
  coordinates: Coordinates;
}

export interface LocationSuggestion extends GeocodeResult {
  id: string;
  name: string;
  description: string;
}

interface MapboxFeature {
  id?: string;
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
  };
}

function featureToGeocodeResult(feature: MapboxFeature, fallback: string): GeocodeResult | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates) return null;

  const [longitude, latitude] = coordinates;
  const properties = feature.properties ?? {};

  return {
    label: properties.full_address || properties.name || fallback,
    coordinates: { latitude, longitude },
  };
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
    types: "address,street,neighborhood,locality,place,postcode",
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
    const name = properties.name || result.label;
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

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    // Keeps the demo usable before the Mapbox key is added.
    return {
      label: query || "Houston, Texas",
      coordinates: { latitude: 29.7604, longitude: -95.3698 },
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
