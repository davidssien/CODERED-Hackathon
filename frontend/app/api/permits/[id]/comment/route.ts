import { permitDataset } from "@/lib/dataset";
import { findPermit } from "@/lib/catalog";
import { buildCommentDraft } from "@/lib/assistance";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const permit = findPermit(permitDataset, id);
  if (!permit) return Response.json({ error: "Permit not found in the Harris County dataset." }, { status: 404 });
  return Response.json({ ...buildCommentDraft(permit), generatedAt: permitDataset.generatedAt, mode: "template" });
}
