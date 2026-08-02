# Supabase setup

The app runs on the committed seed dataset (`src/data/*`) with no database. This directory holds
everything needed to move entity and content storage to Supabase Postgres for production.

## Activate

1. Create a Supabase project (any name; `wayshrine-compass` suggested).
2. Apply the schema: run `migrations/0001_init.sql` in the SQL editor (or `supabase db push` with
   the CLI). It creates the entity tables, `builds`, the load-bearing `build_entities` join table,
   `ingest_runs`, and public-read RLS policies.
3. Seed from the committed dataset (idempotent upserts):
   ```bash
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> \
     npx tsx scripts/seed-supabase.ts
   ```
4. Copy `.env.example` → `.env.local` and fill in the URL and keys.

## Ingestion persistence — current status

`POST /api/ingest` runs the full diff pipeline (`src/lib/ingest/pipeline.ts`) and returns the
report and flagged builds. Today it is a **dry run**: results are returned, not persisted. Wiring
persistence means, inside the route when Supabase env vars are present:

1. Upsert the pipeline's `result.store` entities (same column mapping as `scripts/seed-supabase.ts`).
2. Set `status = 'needs_review'` and `review_reasons` on the flagged build rows.
3. Insert a row into `ingest_runs` with the report for the audit trail.

The pipeline itself is pure and fully tested (`src/lib/ingest/diff.test.ts`); only the persistence
adapter is pending. A read-path adapter implementing the `db` facade in `src/lib/data/index.ts`
against these tables is likewise pending — the seed-mode facade defines the interface to match.
