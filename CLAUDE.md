# Wayshrine Compass — agent notes

Patch-versioned ESO database + guidance site. Next.js App Router, TypeScript, Tailwind v4,
shadcn-style components, Supabase schema in `supabase/migrations/`.

## Invariants — do not break these

- Builds reference entities only by id (sets, skills, CP stars, mundus, food). Never free text.
  `src/lib/entities.ts::buildEntityRefs` derives the build_entities join used by the diff engine.
- Freshness badges are computed from provenance (`src/lib/freshness.ts`), not stored flags.
  Amber must always name the exact changed entity and patch.
- The What Next engine (`src/lib/engine/whatNext.ts`) is a deterministic rules engine. No LLM
  calls. Every rule must respect: DLC gates, level gates, and no addon advice on console.
- Guidance blocks are platform-flagged. Console mode must never render addon instructions
  (`src/lib/platform.ts::renderGuidance`; tested in `src/lib/platform.test.ts`).
- All written guidance is original — never scrape or copy competitor guides.

## Commands

- `npm test` — vitest; the acceptance tests for phases 1/3/4/5 live next to their modules.
- `npm run dev` / `npm run build`.

## Gotchas

- Turbopack drops the space between a `</span>` and following text on the same JSX line — use
  explicit `{" "}` when a styled span sits mid-sentence.
- Seed data lastChangedPatch values are hand-set to demo badge states (e.g. Crystal Shard
  changed in U50 → sorcerer-dps is amber). Keep tests in sync if you change them.
