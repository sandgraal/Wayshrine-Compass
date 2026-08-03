# Wayshrine Compass — agent notes

Patch-versioned ESO database + guidance site. Next.js App Router, TypeScript, Tailwind v4,
Supabase Postgres. Production: https://wayshrine-compass.vercel.app (Vercel project
`wayshrine-compass`, team `sandgraals-projects`; the GitHub repo is connected, so merges to
`main` auto-deploy). Live database: Supabase project ref `ewgvpkneuarzuzjkyiia` (us-west-1).

## Invariants — do not break these

- Builds reference entities only by id (sets, skills, CP stars, mundus, food). Never free text.
  `src/lib/entities.ts::buildEntityRefs` derives the build_entities join used by the diff engine.
- Freshness badges are computed from provenance (`src/lib/freshness.ts`), not stored flags.
  Amber must always name the exact changed entity and patch. Removed-but-referenced entities go
  amber too (tracked types only — see `ProvenanceIndex.tracks`).
- Both data sources build the identical facade via `buildDb()` (`src/lib/data/core.ts`).
  `getDb()` serves Supabase when env vars exist, seed otherwise, and falls back to seed on
  outage. Never persist an ingest when the read source is seed (`canPersist` enforces this).
- Ingest persistence is transactional via the `ingest_apply` Postgres function
  (`supabase/migrations/0002_ingest_apply.sql`) — never write entity rows piecemeal.
- Ingest routes fail closed: missing `INGEST_SECRET` / `CRON_SECRET` → 503, never open access.
- The What Next engine (`src/lib/engine/whatNext.ts`) is a deterministic rules engine. No LLM
  calls. Every rule must respect: DLC gates, level gates, no addon advice on console.
- Console mode is client-side (`src/components/platform-provider.tsx`, useSyncExternalStore over
  localStorage). Console must never render addon instructions (`src/lib/platform.ts`, tested).
- All written guidance is original — never scrape or copy competitor guides.
- Character portraits (`src/lib/portraits.ts`) are decorative only — never a data source, never
  an input to freshness. A build's portrait is picked by hashing its own id, so it must stay
  stable across deploys. Art files live in `public/chars/` (see the README there); every
  portrait falls back to the class sigil, so a missing file must never break a page.

## Commands

- `npm test` — vitest (36 tests; acceptance tests live next to their modules)
- `npm run lint` / `npm run build`
- Seed a Supabase project: `scripts/seed-supabase.ts` (see supabase/README.md)

## Environment / secrets state

- Vercel production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (public), `INGEST_SECRET` + `CRON_SECRET` (sensitive). The INGEST_SECRET value is known to
  no one — it was generated and piped in directly; rotate it when something actually needs to
  call POST /api/ingest.
- `SUPABASE_SERVICE_ROLE_KEY` is NOT set anywhere. Until the user adds it
  (`vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive`, value from the Supabase
  dashboard), ingest runs are dry runs. Never fetch or store this key via tooling.
- `DATASET_URL` is unset — the daily cron (`/api/cron/ingest`) reports "skipped" until a real
  patch-dataset source exists. Wiring one is the top open work item.

## Gotchas (learned the hard way)

- This zsh applies history modifiers to `$VAR:r...` — `git push origin "$SHA:refs/..."`
  silently mangles; write the sha literally or use `${VAR}:refs/...`.
- Turbopack drops the space between `</span>` and following text on the same JSX line — use
  explicit `{" "}` mid-sentence.
- Local artifact dirs (`.design-sync/`, `.ds-sync/`, `ds-bundle/`) are gitignored AND
  eslint-ignored; the claude.ai/design tooling may also switch your checked-out branch —
  verify `git branch --show-current` before committing.
- Pushes to a merged PR's branch trigger no checks; open a fresh PR for post-merge commits.
- `main` is protected (PRs only). The repo is private; Actions works (CI workflow is on main).
- Seed data `lastChangedPatch` values are hand-set to demo badge states (e.g. Crystal Shard
  changed in U50 → sorcerer-dps shows amber). Keep tests in sync if changing them.

## Open work items (in rough priority order)

1. Real datamined dataset source → set `DATASET_URL`; the cron route, validation
   (`parsePatchDataset`), pipeline, and transactional persistence are all ready for it.
2. `SUPABASE_SERVICE_ROLE_KEY` in Vercel env (user action) to activate persistence.
3. Admin review workflow: a "mark reviewed" action that re-stamps `patch_verified` (needs auth).
4. Scribing (Grimoires/Scripts) and Class Mastery entities are not yet modeled in the schema.
5. Planner DPS estimation (explicitly deferred in the v1 spec).
