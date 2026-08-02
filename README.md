# Wayshrine Compass

A patch-versioned Elder Scrolls Online database with a guidance layer on top. Unlike blog-first
competitors, every recommendation here is derived from structured data and carries a patch stamp —
and when a patch changes anything a build references, the build flags itself.

## Core thesis

1. **Never be stale, and prove it.** The patch-diff engine flags any build referencing a changed entity.
2. **Answer first.** Gear, skills, and CP are visible without scrolling; prose is collapsed and optional.
3. **Personalized next actions.** A deterministic rules engine turns a player profile into a ranked to-do list.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest — diff engine, What Next engine, planner, console mode
```

The site runs entirely on the committed seed dataset (`src/data/*`) out of the box — no external
services required.

## Architecture

```
src/data/            Seed entity database (patches, sets, skills, CP, companions, builds…)
src/lib/types.ts     Entity model; everything carries patch provenance
src/lib/entities.ts  buildEntityRefs() — the build_entities join, in code
src/lib/freshness.ts Badge logic: verified / needs_review (with named reasons) / stale
src/lib/ingest/      Patch-diff engine + ingestion pipeline (pure, test-driven)
src/lib/engine/      "What Next" rules engine (deterministic, no LLM)
src/lib/planner/     Build legality validation + stat computation
src/app/             Next.js App Router UI
supabase/migrations/ Full Postgres schema incl. the load-bearing build_entities table
scripts/seed-supabase.ts  Idempotent seeder from the committed dataset
```

Builds never reference game entities as free text — gear, skills, CP stars, mundus, and food are
foreign keys into the entity database. That's what makes the diff → flag pipeline possible.

### Freshness badges

- **Verified for U50** (green) — reviewed since the current patch, nothing referenced has changed.
- **Needs review** (amber) — a referenced entity changed; the page names the exact entity and patch.
- **Stale** (red) — two or more patches behind.

### Ingestion

Two entry points run the same pipeline — diff against the current store, stamp
`last_changed_patch`, emit a report, and flag every build whose `build_entities` rows intersect
the changes:

- `POST /api/ingest` — manual, guarded by `INGEST_SECRET` bearer token.
- `GET /api/cron/ingest` — scheduled daily by `vercel.json`, guarded by `CRON_SECRET`; fetches
  the dataset from `DATASET_URL` (any HTTPS endpoint returning a `PatchDataset`).

Runs are dry (report only) until `SUPABASE_SERVICE_ROLE_KEY` is configured, after which
provenance, build flags, and an `ingest_runs` audit row are persisted.

### Console mode

The header toggle persists a cookie. Guidance blocks are authored with a platform flag; in console
mode addon-dependent blocks are replaced by their authored console alternative (or dropped). The
What Next engine applies the same filter to its recommendations.

## Supabase (optional in dev, intended for production)

1. Create a project, then run `supabase/migrations/0001_init.sql`.
2. Seed it:
   ```bash
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/seed-supabase.ts
   ```
3. Copy `.env.example` to `.env.local` and fill in the keys.

## Out of scope (deliberately)

- Scraping competitor guides — all guidance is original.
- Boosting/carry/gold-selling content of any kind.
- Auto-syncing character data (no official API exists; profiles are manual entry).
- ZeniMax art assets pending a fan-content-policy review.
- Open build submission (curation is the value in v1).

Wayshrine Compass is an unofficial fan resource. The Elder Scrolls Online © ZeniMax Media.
