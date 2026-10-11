import { permitDataset } from "@/lib/dataset";
import { DEMO_LOCATIONS } from "@/lib/demo-locations";
import { buildLocationReport } from "@/lib/report";
import { parseCoordinates } from "@/lib/query";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let coordinates;
  try { coordinates = parseCoordinates(params)!; }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  return Response.json(buildLocationReport(permitDataset, (params.get("label") || "Selected location").slice(0, 256),
    coordinates, DEMO_LOCATIONS));
}
