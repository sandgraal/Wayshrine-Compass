import type { Patch } from "@/lib/types";

/**
 * Patch history, newest last. CURRENT_PATCH drives every freshness badge.
 */
export const patches: Patch[] = [
  {
    id: "patch-u48",
    code: "U48",
    name: "Update 48",
    releasedAt: "2025-11-03",
    season: null,
  },
  {
    id: "patch-u49",
    code: "U49",
    name: "Update 49 — Season of the Roadmap Shift",
    releasedAt: "2026-03-09",
    season: "Season 0",
  },
  {
    id: "patch-u50",
    code: "U50",
    name: "Update 50 — Class Mastery",
    releasedAt: "2026-06-08",
    season: "Season 1",
  },
];

export const CURRENT_PATCH = "U50";

/** Ordered patch codes, oldest → newest. Used for staleness math. */
export const PATCH_ORDER: string[] = patches.map((p) => p.code);
