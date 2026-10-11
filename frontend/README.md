# Permit Watch — Frontend

Next.js + Tailwind + Mapbox interface backed by a cached TCEQ concrete batch plant dataset.

## Run
Use Node.js 22.18+ (Node 24 recommended for the test command).
From `frontend/`:
```bash
npm ci
cp .env.example .env.local
npm run dev
```
Set `NEXT_PUBLIC_MAPBOX_TOKEN` to a public Mapbox `pk.` token in `.env.local` for the interactive map and arbitrary address/ZIP search. Restrict it to the deployed/local domains in Mapbox. Never put a secret token here.

Without a token, the sourced Holmes Road and Jersey Village facility presets still open factual cached reports. Arbitrary input produces a configuration message instead of silently using Houston's center. The map is unavailable in this fallback.

## Integration
- `GET /api/report?lat=…&lng=…&label=…` reads `data/concrete-plants.json` from the repository root.
- `lib/report.ts` calculates straight-line miles and existing/pending counts within 1, 3, and 5 miles, using Harris County records only.
- `lib/types.ts` mirrors the scraper's nullable plant fields, with derived report fields.
- Frontend county validation uses Mapbox's district and region context. Unverified county results are rejected; ZIP results are representative points, not a neighborhood boundary.
- The route's bounding box is a coarse sanity guard, not a county polygon. The report dataset is county-filtered.
- Pending records and existing records can refer to the same physical facility. Counts are records, not unique sites across statuses.
- Records without coordinates remain accessible separately and are excluded from spatial counts.
- The report is cached source information, not a live regulatory feed. It may lag current application status.
- Unknown deadlines and emissions stay unknown. A pending application does not establish an open comment window.
- No environmental/health risk score or fabricated AI text is displayed.
- Schools, Gemini explanations, and editable comment drafting remain unconnected.

Person 2 can replace the implementation behind `/api/report` while preserving the factual `LocationReport` contract. Coordinate this contract with teammates before expanding it.

## Judge demo
1. Choose the Holmes Road or Jersey Village preset.
2. Show 1/3/5-mile counts and open the pending application.
3. Show the distance, source facts, missing-deadline message, and official source link.
4. Click Back to location, then Reset demo.
5. Repeat with the second preset. Refresh is a clean reset.

## Verification
```bash
npm test
npm run typecheck
npm run build
```
The automated tests cover distance units, radius filtering, null preservation, no-result locations, invalid coordinates, and geocoding failure/county handling.

For Vercel, import the full repository and set the project root to `frontend`; keep `data/concrete-plants.json` in the parent directory. The static JSON import is bundled into the report route. Set the public Mapbox token before building.
