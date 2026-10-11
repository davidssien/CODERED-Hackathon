import { permitDataset } from "@/lib/dataset";
import { DEMO_LOCATIONS } from "@/lib/demo-locations";
import { findPermit } from "@/lib/catalog";
import { parseCoordinates } from "@/lib/query";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let coordinates;
  try { coordinates = parseCoordinates(new URL(request.url).searchParams, false); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const permit = findPermit(permitDataset, id, coordinates, DEMO_LOCATIONS);
  if (!permit) return Response.json({ error: "Permit not found in the Harris County dataset." }, { status: 404 });
  return Response.json({ generatedAt: permitDataset.generatedAt, source: permitDataset.source, permit });
}
