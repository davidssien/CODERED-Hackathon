import type { Coordinates } from "./types";

export function parseCoordinates(params: URLSearchParams, required = true): Coordinates | undefined {
  const lat = params.get("lat");
  const lng = params.get("lng");
  if (lat === null && lng === null && !required) return undefined;
  if (!lat?.trim() || !lng?.trim()) throw new Error("Location coordinates are required together.");
  const latitude = Number(lat), longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < 29.49 || latitude > 30.18 || longitude < -95.97 || longitude > -94.9) {
    throw new Error("Permit Watch's current dataset focuses on Harris County.");
  }
  return { latitude, longitude };
}

export interface PermitFilters {
  coordinates?: Coordinates;
  status?: "pending" | "existing";
  radiusMiles?: number;
  query?: string;
}
export function parsePermitFilters(params: URLSearchParams): PermitFilters {
  const coordinates = parseCoordinates(params, false);
  const status = params.get("status");
  if (status !== null && status !== "pending" && status !== "existing") {
    throw new Error("Status must be pending or existing.");
  }
  const radius = params.get("radius");
  if (radius !== null && !coordinates) throw new Error("Radius filtering requires coordinates.");
  const radiusMiles = coordinates ? (radius === null ? 5 : Number(radius)) : undefined;
  if (radiusMiles !== undefined && (!Number.isFinite(radiusMiles) || radiusMiles <= 0 || radiusMiles > 50)) {
    throw new Error("Radius must be greater than zero and at most 50 miles.");
  }
  const query = params.get("q")?.trim();
  if (query && query.length > 256) throw new Error("Search must be at most 256 characters.");
  return { coordinates, status: status ?? undefined, radiusMiles, query };
}
