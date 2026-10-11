import { permitDataset } from "@/lib/dataset";
import { listPermits } from "@/lib/catalog";
import { parsePermitFilters } from "@/lib/query";

export async function GET(request: Request) {
  let filters;
  try { filters = parsePermitFilters(new URL(request.url).searchParams); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const permits = listPermits(permitDataset, filters);
  return Response.json({ generatedAt: permitDataset.generatedAt, source: permitDataset.source,
    count: permits.length, permits });
}
