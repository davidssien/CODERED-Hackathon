# Permit Watch

Next.js + Tailwind + Mapbox interface and backend backed by the repository's cached TCEQ concrete batch plant data. No separate backend service or database is required for the demo.

## Run
Use Node.js 22.18+ (Node 24 recommended). From `frontend/`:
```bash
npm ci
cp .env.example .env.local
npm run dev
```
Set `NEXT_PUBLIC_MAPBOX_TOKEN` to a public Mapbox `pk.` token for the map and arbitrary address/ZIP search. Set `GEMINI_API_KEY` for Gemini explanations; it is read only by the server. `GEMINI_MODEL` defaults to `gemini-2.5-flash` and can be changed to a compatible model available to your account. Never commit `.env.local` or put the Gemini key in a `NEXT_PUBLIC_` variable.

Without keys, Frost, Odom, and Hobby Elementary presets open factual cached reports. Permit lookup, school sample distances, cached fact summaries, and editable comment templates still work. Arbitrary search shows a configuration message, and the live map is unavailable.

## Backend API
| Endpoint | Behavior |
| --- | --- |
| `GET /api/report?lat=…&lng=…&label=…` | Nearby records, 1/3/5-mile counts, unlocated records, and demo school context |
| `GET /api/permits` | All Harris County records, including records without coordinates |
| `GET /api/permits?status=pending&q=77728` | Optional status and case-insensitive name/operator/number/address search |
| `GET /api/permits?lat=…&lng=…&radius=3` | Spatial filter; radius defaults to 5, allowed range is greater than 0 through 50 miles |
| `GET /api/permits/[id]?lat=…&lng=…` | Permit facts, optional distance from the search point, sample schools near the facility; unknown IDs return 404 |
| `GET /api/demo-locations` | Three sourced school locations from `data/demo-addresses.json` |
| `POST /api/permits/[id]/explanation` | Gemini explanation using server-loaded permit facts; clearly labeled cached-facts fallback if unconfigured or unavailable |
| `GET /api/permits/[id]/comment` | Editable factual inquiry template; nothing is submitted or saved |

Bad coordinates and unsupported filters return 400 with an `error` message. Both coordinates must be provided together. Coordinate input uses a coarse Harris County bounding box, not a county polygon; the dataset itself is county-filtered. Client Mapbox search separately verifies county/region context. ZIP searches use a representative point, not a neighborhood boundary.

`lib/types.ts` mirrors the scraper's nullable fields. `lib/report.ts` and `lib/catalog.ts` compute straight-line miles without rounding before radius filtering. Demo data's precomputed counts are ignored. Reports preserve unknown deadlines and emissions; missing quantities do not mean zero. Records without coordinates remain accessible and are excluded from nearby counts. Pending and existing records can concern the same site; counts are records, not unique sites or health risk scores.

School context covers only the three demo schools, not all schools in Harris County. Distances are from the selected point in a location report and from the facility in permit details. No coordinates means facility school distances are unavailable.

Gemini uses the official [Generate Content API](https://ai.google.dev/api/generate-content) with a structured response, a 15-second timeout, and server facts rather than client-supplied facts. Successful explanations are cached per data version/model/permit within the server instance; repeated concurrent clicks share one request. Failures and invalid outputs return the factual fallback. AI explanations are labeled and must be checked against source facts. Live Gemini behavior requires a configured key and has not been verified without one. Comment drafting is a deterministic template, not AI output, and does not assume an open comment period or invent personal circumstances.

## Judge demo
1. Choose Hobby Elementary School.
2. Show the 1/3/5-mile counts and open the pending Holmes Road renewal application.
3. Show the school sample distance, unavailable deadline/emissions, and official source.
4. Click Explain this permit, then Create editable comment. Edit or copy the draft.
5. Return to the location, Reset demo, and repeat with Frost or Odom. Refresh resets the page.

Cached data may lag current status. A pending application does not establish an open comment window. Check the official notice before submitting a comment yourself.

## Verification
```bash
npm test
npm run typecheck
npm run build
npm start
# In another terminal, while the app is running:
npm run test:api
```
Unit tests cover distance/counting, nullable facts, exact radius boundaries, filtering, school coverage, input validation, geocoding, server-side Gemini requests/fallbacks, and comment templates. API smoke tests exercise the built routes. Gemini unit tests use a stubbed provider; they do not verify a live key/model.

For Vercel, import the full repository with project root `frontend`; keep `data/` in the parent directory. Static JSON imports are bundled into the routes. Set the public Mapbox token before building and the server-only Gemini key in the deployment environment. No deployment has been performed as part of this integration.
