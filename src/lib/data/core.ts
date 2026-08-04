import type {
  Build,
  Companion,
  CpStar,
  EntitySupersession,
  Food,
  GearSet,
  MundusStone,
  Patch,
  Skill,
  Zone,
} from "@/lib/types";
import { computeFreshness, type Freshness, type ProvenanceIndex } from "@/lib/freshness";

/** The raw entity collections a data source must supply. */
export interface DbData {
  patches: Patch[];
  sets: GearSet[];
  skills: Skill[];
  cpStars: CpStar[];
  companions: Companion[];
  mundusStones: MundusStone[];
  foods: Food[];
  zones: Zone[];
  builds: Build[];
  /** Recorded entity renames, so freshness can name a removed ref's successor. */
  supersessions?: EntitySupersession[];
  /** Label shown in the footer so the active source is auditable. */
  source: "seed" | "supabase";
}

const TRACKED_ENTITY_TYPES = new Set(["set", "skill", "cp_star"]);

/**
 * Builds the read facade every page consumes. Seed mode and Supabase mode
 * construct it from the same function, so behavior is identical by
 * construction — only the row source differs.
 */
export function buildDb(data: DbData) {
  const patches = [...data.patches].sort((a, b) => a.releasedAt.localeCompare(b.releasedAt));
  const patchOrder = patches.map((p) => p.code);
  const currentPatch = patchOrder[patchOrder.length - 1];

  const setById = new Map(data.sets.map((s) => [s.id, s]));
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const cpStarById = new Map(data.cpStars.map((s) => [s.id, s]));
  const mundusById = new Map(data.mundusStones.map((m) => [m.id, m]));
  const foodById = new Map(data.foods.map((f) => [f.id, f]));
  const buildBySlug = new Map(data.builds.map((b) => [b.slug, b]));

  const supersededByDirect = new Map(
    (data.supersessions ?? []).map((s) => [
      `${s.entityType}:${s.oldId}`,
      { oldName: s.oldName, newId: s.newId, newName: s.newName, patch: s.patch },
    ])
  );

  // Resolve chains: A→B→C returns the terminal entry for A, with cycle
  // protection so a malformed supersession loop never hangs the server.
  function resolveSupersession(entityType: string, entityId: string) {
    const visited = new Set<string>();
    let key = `${entityType}:${entityId}`;
    let entry = supersededByDirect.get(key);
    if (!entry) return undefined;
    while (entry) {
      visited.add(key);
      const nextKey = `${entityType}:${entry.newId}`;
      if (visited.has(nextKey)) break;
      const next = supersededByDirect.get(nextKey);
      if (!next) break;
      entry = next;
      key = nextKey;
    }
    return entry;
  }

  const provenance: ProvenanceIndex = {
    tracks: (entityType) => TRACKED_ENTITY_TYPES.has(entityType),
    supersededBy: (entityType, entityId) => resolveSupersession(entityType, entityId),
    get(entityType, entityId) {
      switch (entityType) {
        case "set": {
          const e = setById.get(entityId);
          return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
        }
        case "skill": {
          const e = skillById.get(entityId);
          return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
        }
        case "cp_star": {
          const e = cpStarById.get(entityId);
          return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
        }
        default:
          return undefined;
      }
    },
  };

  return {
    source: data.source,
    patches,
    currentPatch,
    patchOrder,
    sets: data.sets,
    skills: data.skills,
    cpStars: data.cpStars,
    companions: data.companions,
    mundusStones: data.mundusStones,
    foods: data.foods,
    zones: data.zones,
    builds: data.builds,
    setById,
    skillById,
    cpStarById,
    mundusById,
    foodById,
    getBuild(slug: string): Build | undefined {
      return buildBySlug.get(slug);
    },
    freshness(build: Build): Freshness {
      return computeFreshness(build, provenance, currentPatch, patchOrder);
    },
  };
}

export type Db = ReturnType<typeof buildDb>;
