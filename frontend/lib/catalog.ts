import type { Coordinates, DemoLocation, Permit, PlantsFile } from "./types";
import type { PermitFilters } from "./query";
import { distanceMiles, findSampleSchools } from "./report.ts";

function withDistance(plant: PlantsFile["plants"][number], coordinates?: Coordinates): Permit {
  const located = plant.lat !== null && plant.lng !== null && Number.isFinite(plant.lat) && Number.isFinite(plant.lng);
  return { ...plant, distanceMiles: coordinates && located
    ? distanceMiles(coordinates, { latitude: plant.lat!, longitude: plant.lng! }) : null };
}

export function listPermits(data: PlantsFile, filters: PermitFilters): Permit[] {
  const query = filters.query?.toLowerCase();
  return data.plants.filter(p => p.county === "Harris" && (!filters.status || p.status === filters.status))
    .filter(p => !query || [p.name, p.operator, p.permitNumber, p.address, p.city]
      .some(value => value?.toLowerCase().includes(query)))
    .map(p => withDistance(p, filters.coordinates))
    .filter(p => !filters.coordinates || (p.distanceMiles !== null && p.distanceMiles <= (filters.radiusMiles ?? 5)))
    .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity) || a.id.localeCompare(b.id));
}

export function findPermit(data: PlantsFile, id: string, coordinates?: Coordinates, schools: DemoLocation[] = []): Permit | null {
  const plant = data.plants.find(p => p.id === id && p.county === "Harris");
  if (!plant) return null;
  const permit = withDistance(plant, coordinates);
  permit.schoolContext = plant.lat !== null && plant.lng !== null && Number.isFinite(plant.lat) && Number.isFinite(plant.lng)
    ? findSampleSchools({ latitude: plant.lat, longitude: plant.lng }, schools)
    : { coverage: "demo_sample", sampleSize: schools.length, radiusMiles: 5, schools: [] };
  return permit;
}
