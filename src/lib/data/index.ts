import { builds, buildBySlug } from "@/data/builds";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { companions } from "@/data/companions";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { zones } from "@/data/zones";
import { CURRENT_PATCH, PATCH_ORDER, patches } from "@/data/patches";
import { computeFreshness, type Freshness, type ProvenanceIndex } from "@/lib/freshness";
import type { Build } from "@/lib/types";

/**
 * Data access layer. v1 reads the committed seed dataset (imported TS modules);
 * the same interface is implemented against Supabase by src/lib/data/supabase.ts
 * once NEXT_PUBLIC_SUPABASE_URL / SUPABASE keys are configured. All entity and
 * content storage is queryable structure either way — no markdown files.
 */

const provenance: ProvenanceIndex = {
  get(entityType, entityId) {
    switch (entityType) {
      case "set": {
        const e = sets.find((s) => s.id === entityId);
        return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
      }
      case "skill": {
        const e = skills.find((s) => s.id === entityId);
        return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
      }
      case "cp_star": {
        const e = cpStars.find((s) => s.id === entityId);
        return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
      }
      default:
        return undefined; // mundus/food don't change patch-to-patch in seed data
    }
  },
};

export const db = {
  patches,
  currentPatch: CURRENT_PATCH,
  patchOrder: PATCH_ORDER,
  sets,
  skills,
  cpStars,
  companions,
  mundusStones,
  foods,
  zones,
  builds,

  setById: new Map(sets.map((s) => [s.id, s])),
  skillById: new Map(skills.map((s) => [s.id, s])),
  cpStarById: new Map(cpStars.map((s) => [s.id, s])),
  mundusById: new Map(mundusStones.map((m) => [m.id, m])),
  foodById: new Map(foods.map((f) => [f.id, f])),

  getBuild(slug: string): Build | undefined {
    return buildBySlug.get(slug);
  },

  freshness(build: Build): Freshness {
    return computeFreshness(build, provenance, CURRENT_PATCH, PATCH_ORDER);
  },
};

export type Db = typeof db;
