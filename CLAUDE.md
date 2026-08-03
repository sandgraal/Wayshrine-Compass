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
  stable across deploys. Art files live in `public/chars/` (207 WebPs; see the README there,
  and keep the manifest in portraits.ts in sync — tested); every portrait falls back to the
  class sigil, so a missing file must never break a page.

## Commands

- `npm test` — vitest (65 tests; acceptance tests live next to their modules)
- `npm run lint` / `npm run build`
- Seed a Supabase project: `scripts/seed-supabase.ts` (see supabase/README.md)

## Environment / secrets state

- Vercel production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (public), `INGEST_SECRET` + `CRON_SECRET` (sensitive). The INGEST_SECRET value is known to
  no one — it was generated and piped in directly; rotate it when something actually needs to
  call POST /api/ingest.
- `SUPABASE_SERVICE_ROLE_KEY` IS set in Vercel production (sensitive; added by the user
  2026-08-03). Ingest runs now PERSIST — treat dataset changes as live data mutations.
  Never fetch or store this key via tooling.
- `DATASET_URL` is set in Vercel production: https://wayshrine-compass.vercel.app/dataset/current.json
  (the committed UESP-derived artifact — regenerate via `node scripts/build-dataset.mjs`,
  changes ship as reviewable PRs). The daily cron fetches, diffs, and persists it.
- `ADMIN_SECRET` is set in Vercel production (sensitive). It authorizes
  POST /api/admin/review — the human "mark reviewed" action that re-stamps a build's
  `patch_verified` to the current patch and clears its ingest flags. The route mirrors the
  ingest auth pattern (missing secret → 503, mismatch → 401) and refuses (409) when the read
  source is seed or the requested patch isn't `db.currentPatch`; it never touches entity
  tables. The console at /admin/review lists every build with computed freshness + amber
  reasons and takes the token in a per-tab field (never persisted). The read-only hub at
  /admin (linked from the footer) shows pipeline status and the ingest_runs audit trail
  (service-role read; the table has no public policy). The secret value is held only in the
  user's password manager.

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

(Done: real dataset source + `DATASET_URL`, service-role persistence, admin review workflow.)

1. Renamed-skill build references: 4 seed skills no longer exist in the U50 dataset —
   `fiery-breath`, `spiked-armor`, `stonefist` (dragonknight), `veiled-strike` (nightblade) —
   so every build slotting them is amber with a "removed entity" reason. Blastbones was fixed
   (seed renamed to Sacrificial Bones, morph-verified against the dataset), but these four
   have no morph-verified successor in the dataset (candidates by line: dragonfire-breath,
   burnished-scales, landslide, dark-veil — unconfirmed). Fixing means renaming/moving them in
   `src/data/skills.ts` (build ids derive from skill names) and reseeding the live `builds`
   rows (`scripts/seed-supabase.ts` or a targeted update).
2. What Next card art from the user's generator (see memory: freshness icons landed, card art
   pending).
3. DLC gating data for new sets — UESP's export has no DLC field, so `dlcRequired` is null
   for datamined sets; the What Next DLC-gate rules need another source.
4. Builds expansion against the real catalog (the 28 seed builds only reference a slice of
   the datamined sets/skills).
5. Scribing (Grimoires/Scripts) and Class Mastery entities are not yet modeled in the schema.
6. Planner DPS estimation (explicitly deferred in the v1 spec).
