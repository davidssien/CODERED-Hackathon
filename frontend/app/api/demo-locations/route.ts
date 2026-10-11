import { DEMO_LOCATIONS, DEMO_GENERATED_AT } from "@/lib/demo-locations";

export async function GET() {
  return Response.json({ generatedAt: DEMO_GENERATED_AT, coverage: "demo_sample", locations: DEMO_LOCATIONS });
}
