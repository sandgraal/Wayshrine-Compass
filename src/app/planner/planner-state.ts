import type { ClassName, CpStar, CpTree, GearAssignment, GearSet, GearSlot, Skill } from "@/lib/types";
import { ALL_CLASSES, GEAR_SLOTS } from "@/lib/types";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { buildBySlug } from "@/data/builds";
import { portraitById, portraitForBuild, portraitsMatching } from "@/lib/portraits";

/**
 * Planner draft state and its URL (de)serialization. The draft is persisted
 * exclusively in the `?b=` query param, so every field added here must also be
 * rebuilt in `sanitizeState` — anything the sanitizer doesn't copy silently
 * vanishes on permalink round-trip.
 *
 * Entity data is NOT imported statically: the planner works against whatever
 * the active data facade served (Supabase's full catalog when configured,
 * seed otherwise), passed down from the server as slim `PlannerEntities`.
 * Mundus stones and foods stay static — 13 + 5 rows, identical across
 * sources.
 */

export const TRAITS = ["Divines", "Sturdy", "Training", "Infused", "Bloodthirsty", "Arcane", "Robust", "Precise", "Defending", "Powered", "Nirnhoned", "Charged", "Sharpened"];

/**
 * The slices of each entity the planner actually consumes. Skills drop
 * `description` and `morphs` (the bulk of the serialized payload — the
 * planner never renders either); CP stars keep `effect` because the DPS
 * estimator parses it. Provenance stamps ride along for the freshness
 * preview.
 */
export type PlannerSet = Pick<
  GearSet,
  "id" | "name" | "type" | "source" | "dlcRequired" | "bonuses" | "mythicSlot" | "firstSeenPatch" | "lastChangedPatch"
>;
export type PlannerSkill = Pick<
  Skill,
  "id" | "name" | "className" | "line" | "lineLabel" | "ultimate" | "passive" | "firstSeenPatch" | "lastChangedPatch"
>;
export type PlannerCpStar = Pick<
  CpStar,
  "id" | "name" | "tree" | "slottable" | "effect" | "firstSeenPatch" | "lastChangedPatch"
>;

export interface PlannerEntities {
  sets: PlannerSet[];
  skills: PlannerSkill[];
  cpStars: PlannerCpStar[];
}

/** Lookup tables the client builds once from the passed entities. */
export interface EntityTables {
  sets: PlannerSet[];
  skills: PlannerSkill[];
  cpStars: PlannerCpStar[];
  setById: Map<string, PlannerSet>;
  skillById: Map<string, PlannerSkill>;
  cpStarById: Map<string, PlannerCpStar>;
  /** Every "class/line" pair present in the skill data, with a display label. */
  lines: { id: string; label: string }[];
}

export function makeEntityTables(entities: PlannerEntities): EntityTables {
  const seen = new Map<string, string>();
  for (const s of entities.skills) {
    if (s.className) {
      seen.set(
        `${s.className}/${s.line}`,
        `${s.className[0].toUpperCase()}${s.className.slice(1)} — ${s.lineLabel}`
      );
    }
  }
  return {
    sets: entities.sets,
    skills: entities.skills,
    cpStars: entities.cpStars,
    setById: new Map(entities.sets.map((s) => [s.id, s])),
    skillById: new Map(entities.skills.map((s) => [s.id, s])),
    cpStarById: new Map(entities.cpStars.map((s) => [s.id, s])),
    lines: [...seen.entries()].map(([id, label]) => ({ id, label })),
  };
}

export interface PlannerState {
  className: ClassName;
  lines: string[]; // up to 3 "class/line"
  gear: GearAssignment[];
  bar: { front: string[]; frontUlt: string; back: string[]; backUlt: string };
  cp: Record<CpTree, string[]>;
  mundusId: string;
  foodId: string;
  /** Cosmetic character portrait (`src/lib/portraits.ts` id). Never affects freshness or legality. */
  portraitId?: string;
}

export function defaultState(): PlannerState {
  return {
    className: "sorcerer",
    lines: ["sorcerer/dark-magic", "sorcerer/daedric-summoning", "sorcerer/storm-calling"],
    gear: [],
    bar: { front: [], frontUlt: "", back: [], backUlt: "" },
    cp: { warfare: [], fitness: [], craft: [] },
    mundusId: "mundus-thief",
    foodId: "food-bewitched-sugar-skulls",
  };
}

/**
 * Fork a published (seed) build into a draft. Entity ids derive from names,
 * so seed references resolve identically in the live catalog; callers pass
 * the result through `sanitizeState` with the active tables so anything the
 * current catalog no longer contains (e.g. a renamed skill) drops instead of
 * lingering as a dead reference.
 */
export function stateFromBuild(slug: string): PlannerState | null {
  const b = buildBySlug.get(slug);
  if (!b) return null;
  return {
    className: b.className,
    lines: [...b.subclassLines],
    gear: b.gear.map((g) => ({ ...g })),
    bar: { front: [...b.frontBar.skills], frontUlt: b.frontBar.ultimate, back: [...b.backBar.skills], backUlt: b.backBar.ultimate },
    cp: { warfare: [...b.cp.warfare], fitness: [...b.cp.fitness], craft: [...b.cp.craft] },
    mundusId: b.mundusId,
    foodId: b.foodId,
    // Fork starts with the same character the build page renders.
    portraitId: portraitForBuild(b)?.id,
  };
}

/**
 * Carry a character across a class change: keep the race and gender of the
 * current portrait and pick that combination's first portrait for the new
 * class. No portrait selected (or no art for the combination) → undefined.
 */
export function remapPortrait(portraitId: string | undefined, className: ClassName): string | undefined {
  const current = portraitId ? portraitById(portraitId) : undefined;
  if (!current) return undefined;
  if (current.className === className) return current.id;
  return portraitsMatching({ race: current.race, gender: current.gender, className })[0]?.id;
}

/**
 * Permalink codec, UTF-8 safe: btoa/atob only handle Latin-1, and gear
 * enchant text may carry any character, so the JSON goes through a byte
 * round-trip. ASCII payloads produce byte-identical output to the old
 * encoder, so pre-existing permalinks keep decoding.
 */
export function encodeState(s: PlannerState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return encodeURIComponent(btoa(bin));
}

export function decodeState(raw: string, tables: EntityTables): PlannerState | null {
  try {
    const bin = atob(decodeURIComponent(raw));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return sanitizeState(JSON.parse(new TextDecoder().decode(bytes)), tables);
  } catch {
    return null;
  }
}

/**
 * Replaces one gear slot's assignment, preserving fields the picker doesn't
 * edit (weight, enchant) so a forked build's data survives a trait or set
 * change. Clearing the set clears the slot entirely.
 */
export function updateGearSlot(
  gear: GearAssignment[],
  slot: GearSlot,
  setId: string,
  trait?: string
): GearAssignment[] {
  const existing = gear.find((g) => g.slot === slot);
  const next = gear.filter((g) => g.slot !== slot);
  if (setId) {
    next.push({ ...existing, slot, setId, trait: trait ?? existing?.trait ?? "Divines" });
  }
  return next;
}

/**
 * The `b` query param is user-controlled input. Rebuild a well-formed state
 * from it, keeping only ids that exist in the active entity tables — a
 * crafted URL must degrade to a partial build, never crash the page.
 */
export function sanitizeState(parsed: unknown, tables: EntityTables): PlannerState | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const className = o.className as ClassName;
  if (!ALL_CLASSES.includes(className)) return null;

  const strings = (v: unknown, keep: (s: string) => boolean, max: number): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && keep(x)).slice(0, max)
      : [];

  const isLine = (s: string) => tables.lines.some((l) => l.id === s);
  const isActive = (s: string) => {
    const sk = tables.skillById.get(s);
    return sk !== undefined && !sk.ultimate && sk.passive !== true;
  };
  const isUlt = (v: unknown): v is string =>
    typeof v === "string" && tables.skillById.get(v)?.ultimate === true;
  const cpIn = (tree: CpTree) => (s: string) => {
    const c = tables.cpStarById.get(s);
    return c !== undefined && c.tree === tree && c.slottable;
  };
  // CP slots are a set — a crafted URL repeating one star id must not stack it
  // (the DPS estimator would apply it up to four times). Dedupe before capping.
  const cpTree = (v: unknown, tree: CpTree) => [...new Set(strings(v, cpIn(tree), 16))].slice(0, 4);

  const gear: GearAssignment[] = [];
  if (Array.isArray(o.gear)) {
    for (const raw of o.gear.slice(0, GEAR_SLOTS.length * 2)) {
      if (!raw || typeof raw !== "object") continue;
      const g = raw as Record<string, unknown>;
      const slot = g.slot as GearSlot;
      if (!GEAR_SLOTS.includes(slot)) continue;
      if (typeof g.setId !== "string" || !tables.setById.has(g.setId)) continue;
      if (gear.some((existing) => existing.slot === slot)) continue;
      const trait = typeof g.trait === "string" && TRAITS.includes(g.trait) ? g.trait : "Divines";
      // Optional fields a forked build carries: dropping them here would
      // silently strip armor weights from shared permalinks.
      const weight =
        g.weight === "light" || g.weight === "medium" || g.weight === "heavy" ? g.weight : undefined;
      const enchant =
        typeof g.enchant === "string" && g.enchant.length > 0 && g.enchant.length <= 80
          ? g.enchant
          : undefined;
      gear.push({
        slot,
        setId: g.setId,
        trait,
        ...(weight ? { weight } : {}),
        ...(enchant ? { enchant } : {}),
      });
    }
  }

  const bar = (o.bar && typeof o.bar === "object" ? o.bar : {}) as Record<string, unknown>;
  const cp = (o.cp && typeof o.cp === "object" ? o.cp : {}) as Record<string, unknown>;

  // A portrait must exist in the catalog and depict the sanitized class — a
  // crafted or stale URL must not pair, say, templar art with a sorcerer draft.
  const portrait = typeof o.portraitId === "string" ? portraitById(o.portraitId) : undefined;

  return {
    className,
    lines: strings(o.lines, isLine, 3),
    gear,
    bar: {
      front: strings(bar.front, isActive, 5),
      frontUlt: isUlt(bar.frontUlt) ? bar.frontUlt : "",
      back: strings(bar.back, isActive, 5),
      backUlt: isUlt(bar.backUlt) ? bar.backUlt : "",
    },
    cp: {
      warfare: cpTree(cp.warfare, "warfare"),
      fitness: cpTree(cp.fitness, "fitness"),
      craft: cpTree(cp.craft, "craft"),
    },
    mundusId:
      typeof o.mundusId === "string" && mundusStones.some((m) => m.id === o.mundusId)
        ? o.mundusId
        : defaultState().mundusId,
    foodId:
      typeof o.foodId === "string" && foods.some((f) => f.id === o.foodId)
        ? o.foodId
        : defaultState().foodId,
    portraitId: portrait && portrait.className === className ? portrait.id : undefined,
  };
}
