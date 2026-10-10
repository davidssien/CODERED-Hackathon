import type { ImpactLevel, LocationReport, Permit, PermitType } from "@/lib/types";

const names = [
  ["Bayou Ready Mix", "Gulf Materials LLC"],
  ["Northline Terminal", "Metro Industrial Partners"],
  ["East Loop Processing", "Lone Star Processing Co."],
  ["Magnolia Concrete", "Magnolia Materials"],
  ["Channel Storage", "Coastal Logistics"],
  ["Southside Asphalt", "Prairie Infrastructure"],
] as const;

const offsets = [
  [0.018, -0.021],
  [-0.024, 0.015],
  [0.009, 0.031],
  [-0.032, -0.018],
  [0.025, 0.025],
  [-0.012, -0.036],
] as const;

const scoreToLevel = (score: number): ImpactLevel => {
  if (score >= 75) return "high";
  if (score >= 48) return "watch";
  return "info";
};

const typeByIndex = (index: number): PermitType => {
  if (index % 3 === 0) return "new";
  if (index % 3 === 1) return "expansion";
  return "renewal";
};

function permitFromIndex(index: number, latitude: number, longitude: number): Permit {
  const impactScore = [87, 72, 64, 55, 43, 31][index];
  const [facilityName, operator] = names[index];
  const [latOffset, lngOffset] = offsets[index];

  return {
    id: `demo-${index + 1}`,
    permitNumber: `TCEQ-DEMO-${4100 + index}`,
    facilityName,
    operator,
    type: typeByIndex(index),
    status: "pending",
    coordinates: {
      latitude: latitude + latOffset,
      longitude: longitude + lngOffset,
    },
    distanceMiles: [1.2, 1.8, 2.4, 3.1, 3.8, 4.4][index],
    impactScore,
    impactLevel: scoreToLevel(impactScore),
    dateProposed: ["2026-10-07", "2026-10-02", "2026-09-29", "2026-09-22", "2026-09-18", "2026-09-11"][index],
    commentDeadline: ["2026-10-18", "2026-10-21", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-14"][index],
    summary: [
      "A proposed concrete batch operation with a modeled increase in particulate emissions near residential blocks.",
      "An expansion request that would increase truck throughput and permitted combustion emissions.",
      "A processing permit renewal with several existing emission points and moderate cumulative burden nearby.",
      "A new materials operation whose primary modeled concern is fine particulate matter from handling and traffic.",
      "A storage permit with lower direct emissions but added industrial activity in an already burdened corridor.",
      "A renewal with comparatively small modeled emission changes and greater distance from the searched location.",
    ][index],
    aiEstimate: [
      "This permit is the highest-priority item in the demo because its projected particulate increase is relatively large, it is close to the searched location, and the surrounding area already has multiple industrial sources.",
      "The projected impact is elevated mainly because of added throughput, combustion emissions, and proximity. The score is lower than the top-ranked permit because modeled particulate changes are smaller.",
      "The renewal does not necessarily create a new source, but existing emissions combined with nearby facilities make cumulative burden the main concern.",
      "The permit has a moderate estimated impact. Distance reduces exposure relative to the highest-ranked items, but fine-particle emissions and truck traffic still raise the score.",
      "Direct permitted emissions are modest in this mock record. The score comes mostly from cumulative industrial density rather than one dominant pollutant increase.",
      "This item ranks lowest in the current demo because its projected changes are small and it is farther from the selected address.",
    ][index],
    reasons: [
      ["High particulate increase", "1.2 miles from location", "Multiple nearby industrial sources"],
      ["Higher truck throughput", "Combustion emissions", "Near residential blocks"],
      ["Cumulative burden", "Existing emission points", "Moderate distance"],
      ["Fine particulate matter", "Material handling", "Truck traffic"],
      ["Industrial density", "Lower direct increase", "Storage activity"],
      ["Small modeled change", "Greater distance", "Renewal rather than new source"],
    ][index],
    pollutants: [
      { name: "PM2.5", tonsPerYear: Math.round((5.8 - index * 0.55) * 10) / 10, changeTonsPerYear: Math.round((2.4 - index * 0.31) * 10) / 10 },
      { name: "NOx", tonsPerYear: Math.round((8.4 - index * 0.72) * 10) / 10, changeTonsPerYear: Math.round((1.8 - index * 0.22) * 10) / 10 },
      { name: "VOC", tonsPerYear: Math.round((4.1 - index * 0.33) * 10) / 10, changeTonsPerYear: Math.round((1.1 - index * 0.12) * 10) / 10 },
    ],
  };
}

export function getMockLocationReport(label: string, latitude: number, longitude: number): LocationReport {
  const permits = Array.from({ length: 6 }, (_, index) => permitFromIndex(index, latitude, longitude));

  return {
    label,
    coordinates: { latitude, longitude },
    score: 68,
    scoreLabel: "Watch",
    summary:
      "This area shows a moderate environmental burden in the demo model. Current air conditions are acceptable, but nearby industrial activity and heat exposure pull the overall score down.",
    environmentalImpact:
      "The strongest modeled pressures are nearby permitted industrial sources and heat exposure. This is placeholder scoring until the live TCEQ, H3AT, school, and air-monitor datasets are connected.",
    metrics: [
      { label: "Air quality", value: 78, helper: "Current + recent monitor trend", tone: "good" },
      { label: "Industrial burden", value: 57, helper: "Permitted sources nearby", tone: "warning" },
      { label: "Heat exposure", value: 62, helper: "Relative neighborhood heat", tone: "warning" },
      { label: "Sensitive sites", value: 84, helper: "Schools / care sites nearby", tone: "neutral" },
    ],
    permits,
    updatedAt: new Date().toISOString(),
  };
}
