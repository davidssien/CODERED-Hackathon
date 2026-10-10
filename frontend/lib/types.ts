export type PermitType = "new" | "expansion" | "renewal";
export type PermitStatus = "pending" | "approved" | "operating";
export type ImpactLevel = "high" | "watch" | "info";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationMetric {
  label: string;
  value: number;
  unit?: string;
  helper: string;
  tone: "good" | "neutral" | "warning";
}

export interface Pollutant {
  name: string;
  tonsPerYear: number;
  changeTonsPerYear: number;
}

export interface Permit {
  id: string;
  permitNumber: string;
  facilityName: string;
  operator: string;
  type: PermitType;
  status: PermitStatus;
  coordinates: Coordinates;
  distanceMiles: number;
  impactScore: number;
  impactLevel: ImpactLevel;
  dateProposed: string;
  commentDeadline: string;
  acceptedDate?: string;
  noticeUrl?: string;
  summary: string;
  aiEstimate: string;
  reasons: string[];
  pollutants: Pollutant[];
}

export interface LocationReport {
  label: string;
  coordinates: Coordinates;
  score: number;
  scoreLabel: string;
  summary: string;
  environmentalImpact: string;
  metrics: LocationMetric[];
  permits: Permit[];
  updatedAt: string;
}
