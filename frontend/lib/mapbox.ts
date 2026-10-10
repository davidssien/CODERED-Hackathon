import type { Coordinates } from "@/lib/types";

export interface GeocodeResult { label: string; coordinates: Coordinates }

export async function geocodeAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!query.trim()) throw new Error("Enter a Harris County address or ZIP code.");
  if (!token) throw new Error("Address search is not configured. Select a preset demo location below.");

  const params = new URLSearchParams({
    q: query.trim(), access_token: token, limit: "1", country: "us", autocomplete: "false",
    types: "address,postcode", proximity: "-95.3698,29.7604",
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal });
  if (!response.ok) throw new Error("Address search is unavailable. Try a preset demo location.");
  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error("No matching address found.");
  const context = feature.properties?.context;
  const county = context?.district?.name;
  const state = context?.region?.name;
  if (county !== "Harris County" || state !== "Texas") {
    throw new Error(county && state
      ? "Permit Watch's current hackathon dataset focuses on Harris County. Broader Texas coverage is planned."
      : "We could not verify that this location is in Harris County. Try a street address or a preset demo location.");
  }
  const coords = feature.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2 || !coords.every(Number.isFinite)) throw new Error("The address result has no reliable coordinates.");
  const [longitude, latitude] = coords;
  return { label: feature.properties?.full_address || feature.properties?.name || query,
    coordinates: { latitude, longitude } };
}
