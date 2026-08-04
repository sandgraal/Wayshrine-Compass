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

- `npm test` — vitest (185 tests; acceptance tests live next to their modules)
- `npm run lint` / `npm run build`
- Seed a Supabase project: `scripts/seed-supabase.ts` (see supabase/README.md)
- Scaffold new seed sets/skills from the artifact (correct-by-construction ids, tiers,
  stats, morphs; passives refused): `npx tsx scripts/scaffold-entities.ts <set-id|skill-id> …`

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

- Migration numbering: two files were both authored as `0004` on separate branches; the
  scribing one is renamed `0005`, and `0006_ingest_apply_v4.sql` is the canonical
  `ingest_apply` (scribing + game_id/supersessions + cp-star first_seen_patch). Any future
  change to `ingest_apply` must start from 0006's body, and new migrations must check the
  highest existing number ON MAIN, not the local branch.

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
  changed in U50 → sorcerer-dps shows amber; each class's core spammable is marked U50 to
  reflect the "Class Mastery" overhaul). Keep tests in sync if changing them.
- No build ships green: `finalize` in `src/data/builds.ts` stamps `patchVerified` below
  `currentPatch` for every build (`PRIOR_PATCH` → amber when it references a U50-changed entity,
  else `STALE_PATCH` → stale). Green ("verified") is reserved for the human /admin review, which
  re-stamps to the current patch. `src/data/builds.test.ts` fails CI if any build computes to
  verified or if a build references an id absent from `public/dataset/current.json`. Do not
  "fix" amber/stale builds by stamping them to the current patch.
- Authoring guards (added after a review caught real mistakes): `builds.test.ts` also fails if a
  build slots a **passive** (a dataset skill with no morphs that is not an ultimate — the
  datamined skill list mixes passives in, so a name match is not enough). `sets.test.ts` checks
  each seed set exists in the artifact, its bonus **tier structure** matches, and every declared
  stat delta is named in its own effect text. Seed set numbers/wording are otherwise approximate
  by design (ingest reconciles), so do not add a seed-matches-artifact bonus-for-bonus test.
  To add new sets/skills without tripping these guards, scaffold from the artifact with
  `scripts/scaffold-entities.ts` (fills ids/tiers/stats/morphs, refuses passives, leaves prose
  as TODOs) rather than hand-writing them.

## Open work items (in rough priority order)

(Done: real dataset source + `DATASET_URL`, service-role persistence, admin review workflow,
renamed-skill references, build-catalog expansion to 42 builds against the real catalog,
planner DPS estimation — `src/lib/planner/dps.ts` + `bonus-extract.ts`, surfaced in the
Computed Stats rail as an explicit model with assumptions and a "not modeled" list,
Scribing + Class Mastery entities — grimoires/scribing_scripts/class_mastery_lines tables,
tracked freshness types, /skills Scribing section; migration 0005. Builds derive mastery_line
refs from subclassLines; grimoire/script refs come from the optional `scribedSkills` build
field, which no build uses yet. Per-grimoire script combination text
(`craftedScriptDescriptions`) is deliberately unmodeled.)

1. DLC gating data for new sets — UESP's export has no DLC field, so `dlcRequired` is null
   for datamined sets; the What Next DLC-gate rules need another source.

(What Next card art shipped — all 20 WebPs live in public/whatnext/. The broader improvement
program of 2026-08 is tracked in the session plan + memory: freshness signal integrity, patch
tracker rebuild, What Next check-off, entity art system, planner overhaul, de-AI pass.)
