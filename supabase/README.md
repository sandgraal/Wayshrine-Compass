# Supabase setup

The app runs on the committed seed dataset (`src/data/*`) with no database. This directory holds
everything needed to move entity and content storage to Supabase Postgres for production.

## Activate

1. Create a Supabase project (any name; `wayshrine-compass` suggested).
2. Apply the schema: run every file in `migrations/` in order in the SQL editor (or
   `supabase db push` with the CLI). 0001 creates the entity tables, `builds`, the load-bearing
   `build_entities` join table, `ingest_runs`, and public-read RLS policies; 0003 the
   ingest-run summary view; 0004 adds rename support (`game_id`, `entity_supersessions`);
   0005 the Scribing (`grimoires`, `scribing_scripts`) and `class_mastery_lines` tables;
   0006 is the canonical `ingest_apply` definition (it supersedes the bodies installed by
   0002/0004/0005 and completes cp-star provenance).
3. Seed from the committed dataset (idempotent upserts):
   ```bash
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> \
     npx tsx scripts/seed-supabase.ts
   ```
4. Copy `.env.example` → `.env.local` and fill in the URL and keys.

## Pushing build changes (without touching entity tables)

`scripts/seed-supabase.ts` is a **full** seed — it also overwrites the entity tables
(`sets`, `skills`, `cp_stars`, …) from the smaller committed seed slice, so on a live project
that has already ingested the U50 dataset it would clobber that data. To sync **only** the builds
after editing `src/data/builds.ts`, use the builds-only script — it upserts `builds` and rebuilds
the `build_entities` join (deleting + reinserting the join rows of exactly the builds it writes,
so a renamed reference never leaves an orphan) and never touches the ingest-owned entity tables:

```bash
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> \
  npx tsx scripts/seed-builds.ts
```

Get the values from the Supabase dashboard (Settings → API keys); the service-role key is never
committed or fetched by tooling.

## Read path

`getDb()` in `src/lib/data/index.ts` serves the live database whenever
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set (in-process cache,
5-minute TTL, automatic fallback to the committed seed dataset on outage). The site footer shows
the active source. Row mappers live in `src/lib/data/supabase-map.ts` with round-trip tests
against the seeder's column mapping.

## Ingestion persistence

`POST /api/ingest` always runs the diff pipeline and returns the report. When
`SUPABASE_SERVICE_ROLE_KEY` is also present in the server environment, the run is **persisted**:
entity provenance is upserted, flagged builds get `status = 'needs_review'` +
`review_reasons`, and an `ingest_runs` audit row is written. Without the key it stays a dry run.

The service-role key is intentionally never stored in the repo or fetched by tooling — copy it
from the Supabase dashboard (Settings → API keys) into the deployment environment
(`vercel env add SUPABASE_SERVICE_ROLE_KEY production`).
