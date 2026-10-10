import data from "../../../../data/concrete-plants.json";
import { buildLocationReport } from "@/lib/report";
import type { PlantsFile } from "@/lib/types";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");
  if (!lat?.trim() || !lng?.trim()) return Response.json({ error: "Location coordinates are required." }, { status: 400 });
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < 29.49 || latitude > 30.18 || longitude < -95.97 || longitude > -94.9) {
    return Response.json({ error: "Permit Watch's current dataset focuses on Harris County." }, { status: 400 });
  }
  const report = buildLocationReport(data as PlantsFile, (params.get("label") || "Selected location").slice(0, 256),
    { latitude, longitude });
  return Response.json(report);
}
