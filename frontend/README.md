# Permit Watch — Frontend

A Next.js + Tailwind + Mapbox implementation of the provided wireframes.

## What is implemented

- **Globe landing state** with a centered address search.
- **Mapbox globe → neighborhood transition** after an address is searched.
- Search bar animates from the landing position into the **top-left compact state**.
- **Location report panel** opens first (not the permit AI panel).
- Neighborhood condition score, air quality / industrial burden / heat / sensitive-site metrics.
- Ranked list of **pending permits**.
- Clicking a permit opens the **AI Estimate** view with impact score, reasons, emissions, dates, and PDF hook.
- Permit pins are also clickable directly on the map.
- Loading skeletons for location loading and an AI-analysis loading state.
- Mobile layout turns the right panel into a bottom sheet.
- Demo fallback still renders if a Mapbox token has not been added.

## 1. Install

```bash
npm install
```

## 2. Add Mapbox

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then add your public Mapbox token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxx
```

Use a **public** `pk.` token and restrict it to your Vercel/local domains in the Mapbox dashboard.

## 3. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Integration contract

The UI is intentionally separated from the future backend.

- `lib/types.ts` is the shared frontend data contract.
- `lib/mock-data.ts` is the only place generating demo environmental/permit records.
- Replace `getMockLocationReport(...)` in `components/permit-watch-app.tsx` with the backend call when Person 2's API is ready.
- Keep the returned object shaped like `LocationReport` and the UI does not need to change.

A future call can be as simple as:

```ts
const response = await fetch(`/api/report?lat=${lat}&lng=${lng}`);
const report: LocationReport = await response.json();
setReport(report);
```

## Files your frontend role mainly owns

```text
app/
components/
lib/mapbox.ts
lib/mock-data.ts   # temporary until backend is live
```

Avoid changing the shared `lib/types.ts` contract without telling the backend/data teammates.

## Important demo note

All scoring and permits in `lib/mock-data.ts` are clearly marked as **demo data**. Do not present them as real environmental facts. When the live TCEQ / H3AT / monitor data is ready, swap the data source without changing the view components.
