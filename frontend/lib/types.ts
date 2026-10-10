export interface Coordinates { latitude: number; longitude: number }
export interface Plant {
  id: string;
  permitNumber: string | null;
  category: "concrete_batch_plant";
  name: string | null;
  operator: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  locationSource: "tceq_map_link" | "geocoded" | "manual" | null;
  status: "pending" | "existing";
  permitType: "new" | "renewal" | "amendment" | null;
  dateReceived: string | null;
  commentDeadline: string | null;
  productionRate: string | null;
  emissions: { pollutant: string; tonsPerYear: number }[];
  noticeUrl: string | null;
  scrapedAt: string;
  notes: string | null;
}
export interface PlantsFile {
  generatedAt: string; source: string; count: number; plants: Plant[];
}
export interface Permit extends Plant { distanceMiles: number | null }
export interface LocationReport {
  label: string;
  coordinates: Coordinates;
  generatedAt: string;
  source: string;
  datasetCount: number;
  metrics: { radiusMiles: number; existing: number; pending: number }[];
  permits: Permit[];
  unlocatedPermits: Permit[];
}
