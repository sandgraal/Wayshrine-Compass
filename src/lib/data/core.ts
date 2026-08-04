import type {
  Build,
  ClassMasteryLine,
  Companion,
  CpStar,
  Food,
  GearSet,
  Grimoire,
  MundusStone,
  Patch,
  ScribingScript,
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
  grimoires: Grimoire[];
  scripts: ScribingScript[];
  classMasteryLines: ClassMasteryLine[];
  companions: Companion[];
  mundusStones: MundusStone[];
  foods: Food[];
  zones: Zone[];
  builds: Build[];
  /** Label shown in the footer so the active source is auditable. */
  source: "seed" | "supabase";
}

const TRACKED_ENTITY_TYPES = new Set(["set", "skill", "cp_star"]);

/**
 * Newer tracked types (Scribing + Class Mastery, U50 modeling). Tracked so a
 * removed grimoire/script/class line ambers the builds referencing it — but
 * only when the data source actually carries the collection. A live database
 * that predates their first ingest has empty tables, and treating an empty
 * collection as authoritative would mass-amber every build with a
 * subclassLines entry. Empty ⇒ not authoritative ⇒ freshness skips the type.
 */
const TRACKED_WHEN_PRESENT: [string, (data: DbData) => number][] = [
  ["grimoire", (d) => d.grimoires.length],
  ["script", (d) => d.scripts.length],
  ["mastery_line", (d) => d.classMasteryLines.length],
];

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
  const grimoireById = new Map(data.grimoires.map((g) => [g.id, g]));
  const scriptById = new Map(data.scripts.map((s) => [s.id, s]));
  const masteryLineById = new Map(data.classMasteryLines.map((m) => [m.id, m]));
  const mundusById = new Map(data.mundusStones.map((m) => [m.id, m]));
  const foodById = new Map(data.foods.map((f) => [f.id, f]));
  const buildBySlug = new Map(data.builds.map((b) => [b.slug, b]));

  const tracked = new Set(TRACKED_ENTITY_TYPES);
  for (const [type, count] of TRACKED_WHEN_PRESENT) {
    if (count(data) > 0) tracked.add(type);
  }

  const provenance: ProvenanceIndex = {
    tracks: (entityType) => tracked.has(entityType),
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
        case "grimoire": {
          const e = grimoireById.get(entityId);
          return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
        }
        case "script": {
          const e = scriptById.get(entityId);
          return e && { name: e.name, lastChangedPatch: e.lastChangedPatch };
        }
        case "mastery_line": {
          const e = masteryLineById.get(entityId);
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
    grimoires: data.grimoires,
    scripts: data.scripts,
    classMasteryLines: data.classMasteryLines,
    companions: data.companions,
    mundusStones: data.mundusStones,
    foods: data.foods,
    zones: data.zones,
    builds: data.builds,
    setById,
    skillById,
    cpStarById,
    grimoireById,
    scriptById,
    masteryLineById,
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
