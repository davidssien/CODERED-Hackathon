import type { Coordinates, Permit, PlantsFile, LocationReport, DemoLocation, SchoolContext } from "./types";

export function distanceMiles(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLng = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) *
    Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function buildLocationReport(data: PlantsFile, label: string, coordinates: Coordinates, schools: DemoLocation[] = []): LocationReport {
  if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude) ||
      Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180) {
    throw new Error("Invalid coordinates.");
  }
  const plants = data.plants.filter(p => p.county === "Harris");
  const located: Permit[] = [];
  const unlocatedPermits: Permit[] = [];
  for (const plant of plants) {
    if (plant.lat === null || plant.lng === null || !Number.isFinite(plant.lat) || !Number.isFinite(plant.lng)) {
      unlocatedPermits.push({ ...plant, distanceMiles: null });
    } else {
      located.push({ ...plant, distanceMiles: distanceMiles(coordinates, { latitude: plant.lat, longitude: plant.lng }) });
    }
  }
  const metrics = [1, 3, 5].map(radiusMiles => ({
    radiusMiles,
    existing: located.filter(p => p.status === "existing" && p.distanceMiles! <= radiusMiles).length,
    pending: located.filter(p => p.status === "pending" && p.distanceMiles! <= radiusMiles).length,
  }));
  const permits = located.filter(p => p.distanceMiles! <= 5)
    .sort((a, b) => a.distanceMiles! - b.distanceMiles! || a.id.localeCompare(b.id));
  return { label, coordinates, generatedAt: data.generatedAt, source: data.source,
    datasetCount: plants.length, metrics, permits, unlocatedPermits, schoolContext: findSampleSchools(coordinates, schools) };
}

export function findSampleSchools(coordinates: Coordinates, schools: DemoLocation[]): SchoolContext {
  return {
    coverage: "demo_sample", sampleSize: schools.length, radiusMiles: 5,
    schools: schools.map(school => ({ ...school, distanceMiles: distanceMiles(coordinates, school.coordinates) }))
      .filter(school => Number.isFinite(school.distanceMiles) && school.distanceMiles <= 5)
      .sort((a, b) => a.distanceMiles - b.distanceMiles || a.id.localeCompare(b.id)),
  };
}
