# Hotel Fit Solutions

Venue-aware wellness operating system built with Next.js 14 (App Router) and Supabase. The platform powers the in-room builder, displays (TV, tablet, timer, HRM) and now includes scaffolding for the Stage 1.5 upgrade roadmap (body scan dashboard, TDEE lab, CRM, POS, analytics, and PWA prep).

## Upgrade Roadmap

### 2025 v3.0 Overview
We captured the full **Hotel Fit Solutions v3.0** product brief (modules, schema, APIs, roadmap, pricing) inside [`docs/hotel-fit-suite-v3.md`](docs/hotel-fit-suite-v3.md). Use that doc as the source of truth when implementing the new multi-tenant CMS, playlist engine, POS/inventory stack, and analytics upgrades.

### 2025 v2.0 Recap

- **Venue-first UX** – `useVenueContext` + `resolveBrandColors` ensure every screen inherits the active palette, logo, and storage namespace. Exercise media now flows through the Supabase library so venue overrides populate builders, displays, and mobile.
- **Operational modules** – New pages under `/body-scan`, `/tdee`, `/hrm-live`, `/pos`, `/crm`, and `/analytics` stub the workflows described in the roadmap. Each connects to a mocked integration layer so teams can swap in real APIs without touching UI code.
- **Data platform** – Supabase migrations create library tables plus placeholders for pgvector, body scans, HRM sessions, and TDEE logs (see `supabase/migrations/*`). Each migration is idempotent and ready for Supabase CLI deploys.
- **PWA readiness** – Added `manifest.webmanifest`, service worker, and runtime registration so tablets/phones can pin the app offline. Metadata now advertises the manifest for install prompts.
- **Developer experience** – Supabase CLI scripts, richer `.env.example`, and an expanded README streamline onboarding. The repo documents branching (`main`, `dev`, `staging`) and highlights manual steps for BLE/VisBody/Stripe stubs.

## Getting Started

```bash
npm install
cp .env.example .env.local # fill in Supabase + integration keys

# Supabase CLI (requires docker)
npm run supabase:start      # launches local db + storage
npm run supabase:reset      # optional reset

# Dev server
npm run dev
```

The builder, displays, and new ops pages all run inside the same `next dev` process (default port 3100). Supabase migrations live in `supabase/migrations`; run `supabase db push` after editing.

### App Modes & Feature Flags

- `NEXT_PUBLIC_APP_MODE` controls which experience renders inside the PWA (`hotel` vs `gym`). The default is `hotel`; set to `gym` to surface POS, circuit, and builder tools.
- Optional knobs like `NEXT_PUBLIC_FEATURES_CIRCUIT` let you flip individual capabilities while API work is still in progress.
- `.env.example` documents the full set of variables for Supabase, Stripe, Postmark, VisBody, BLE bridge URLs, and wearable integrations. Copy it to `.env.local` and fill in real credentials before running `next dev`.

## PWA Prep

- `public/manifest.webmanifest` and `public/sw.js` define the app shell cache.  
- `components/PwaUpdater` registers the service worker on every route.  
- `metadata.manifest` + `themeColor` enable Add-to-Home-screen prompts.  
- Offline support now precaches the builder, display, HRM, and analytics routes plus a dedicated `/offline` fallback. Update `CORE_ROUTES` in `public/sw.js` when you ship a new entrypoint that should run offline.

## API Scaffold (v1)

| Endpoint | Status | Notes |
| -------- | ------ | ----- |
| `POST /api/auth/magic-link` | ✅ | Generates Supabase magic links and dispatches via Postmark (mocked when token missing). |
| `GET /api/memberships/tiers` | ✅ | Reads active tiers per venue, wired to the new `membership_tiers` table. |
| `POST /api/checkins` | ✅ | Validates active membership and logs a `check_ins` row (status 402 when expired). |
| `/api/meal-orders/*` | ✅ | Existing kitchen flow kept for in-room ordering proof of concept. |

These handlers currently return JSON and basic error codes so the mobile dashboard can integrate before the full CRM layer lands. Extend them as Stripe/Postmark credentials become available.

## Feature Highlights

| Route | Purpose |
| ----- | ------- |
| `/body-scan` | VisBody dashboard pulling latest + historical scans (mocked until API credentials are supplied). |
| `/tdee` | Calculator + nutrition targets wired to the TDEE integration stub. |
| `/hrm-live` | BLE/WebSocket preview that mirrors what lands on HRM TV. |
| `/pos` | Stripe Connect / POS control center with quick charge + payout log. |
| `/crm` | Postmark automation manager – send yourself template previews from staging. |
| `/analytics` | KPI overview ready to swap for Metabase/Looker dashboards. |

## Integrations & Env Vars

| Module | File | Env Vars |
| ------ | ---- | -------- |
| Supabase | `lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| VisBody | `lib/integrations/visbody.ts` | `VISBODY_API_KEY`, `VISBODY_WEBHOOK_SECRET` |
| Stripe Connect/POS | `lib/integrations/stripe.ts` | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_CONNECT_CLIENT_ID` |
| Postmark | `lib/integrations/postmark.ts` | `POSTMARK_SERVER_TOKEN`, `POSTMARK_STREAM_ID` |
| BLE Bridge | `lib/integrations/ble.ts` | `BLE_BRIDGE_URL` (documenting target service) |
| Wearables (Garmin/WHOOP) | `lib/integrations/wearables.ts` | `WEARABLES_*` client credentials |

All integration files ship with mocked data so the UI renders without credentials. Swap the placeholder logic for real SDK calls inside these modules.

> **Supabase project ref:** `xxknmjnvyeckmjlexxbs`  
> - Set `NEXT_PUBLIC_SUPABASE_URL=https://xxknmjnvyeckmjlexxbs.supabase.co`.  
> - Copy the anon + service-role keys from **Supabase Dashboard → Project Settings → API** and paste them into `.env.local`, `.env.build`, and `.env.production`.  
> - Rotate the existing keys if they were previously committed, then redeploy so Vercel receives the new secrets.

## Developer Workflow

1. Branch from `dev`, open a draft PR against `staging`, then merge to `main` for production deployments.
2. Use Supabase CLI locally; migrations live under `supabase/migrations`.
3. Run `npm run check:supabase` after updating `.env.local` to confirm the project can reach Supabase tables and the local admin APIs are responding.
3. `npm run lint` before pushing – Next.js includes a default ESLint config.
4. Manual tests required for BLE + VisBody flows until hardware bridges are online.

## Remaining TODOs

- Wire the mocked integration modules to production APIs.
- Replace placeholder analytics with data from Supabase cron jobs / pgvector searches.
The scaffolding above keeps progress unblocked today while making it obvious where to connect each production service tomorrow. Happy building!
# Advanced ROI & Analytics

The latest HotelFit release introduces the Fathom-style Financial Engine:

- **CSV Import / XLSX Export** – Upload Google Sheets exports to `/api/import/csv`, validate the data, and generate multi-sheet XLSX reports from `/api/export/xlsx`.
- **Real-time ROI cockpit** – `/financials/roi` hosts sliders, charts, KPI cards, competitor intelligence, and scenario saving (Base, Conservative, Aggressive, AI-driven). Every interaction recalculates monthly profit, annual ROI, payback, EBITDA, forecasts, and occupancy curves.
- **Competitor intelligence & matching** – Dynamic pricing cards sync with the ROI engine so a single tap pushes suggested rates into your simulations.
- **AI assistant** – Hit “Generate AI summary” to call `/api/ai/insights` (OpenAI key required) for cost reduction ideas, pricing adjustments, and investor-ready reporting.
- **Manual data builder** – Every sheet (assets/CAPEX, staff costs, OPEX, variable costs, memberships, booking/competitor projections) is editable on the `/financials` page. Type values, add rows or upload CSVs, then hit “Save section” to refresh the charts and exports so the in-app tables match your Excel tabs.
- **Room workout library** – A dedicated `/room-workout/builder` page captures workout/stretch/meditation/relax rituals, which then feed into the TV library page for guests.

Google Sheets integration options:
1. Manual CSV Upload (recommended for clients): export a sheet, POST to `/api/import/csv`, and you have instant KPIs.
2. Real-time API sync (internal): hook the Google Sheets API to Supabase and trigger webhooks per edit for live updates.
