import { permitDataset } from "@/lib/dataset";
import { DEMO_LOCATIONS } from "@/lib/demo-locations";
import { findPermit } from "@/lib/catalog";
import { explainPermit, type PermitExplanation } from "@/lib/assistance";

// Reuse successful explanations for this data version and coalesce repeated clicks.
const cache = new Map<string, PermitExplanation>();
const pending = new Map<string, Promise<PermitExplanation>>();
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const permit = findPermit(permitDataset, id, undefined, DEMO_LOCATIONS);
  if (!permit) return Response.json({ error: "Permit not found in the Harris County dataset." }, { status: 404 });
  const key = `${permitDataset.generatedAt}:${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:${id}`;
  let result = cache.get(key);
  if (!result) {
    let generation = pending.get(key);
    if (!generation) {
      generation = explainPermit(permit, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL });
      pending.set(key, generation);
    }
    try {
      result = await generation;
      if (result.mode === "gemini") cache.set(key, result);
    } finally { pending.delete(key); }
  }
  return Response.json({ ...result, generatedAt: permitDataset.generatedAt });
}
