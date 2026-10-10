import type { Coordinates } from "@/lib/types";

export interface GeocodeResult {
  label: string;
  coordinates: Coordinates;
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
  const feature = data.features?.[0];

  if (!feature) {
    throw new Error("No matching address found.");
  }

  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    label: feature.properties?.full_address || feature.properties?.name || query,
    coordinates: { latitude, longitude },
  };
}
