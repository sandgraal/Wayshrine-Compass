import type { ClassName, CpTree, GearAssignment, GearSlot } from "@/lib/types";
import { ALL_CLASSES, GEAR_SLOTS } from "@/lib/types";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { buildBySlug } from "@/data/builds";
import { portraitById, portraitForBuild, portraitsMatching } from "@/lib/portraits";

/**
 * Planner draft state and its URL (de)serialization. The draft is persisted
 * exclusively in the `?b=` query param, so every field added here must also be
 * rebuilt in `sanitizeState` — anything the sanitizer doesn't copy silently
 * vanishes on permalink round-trip.
 */

export const TRAITS = ["Divines", "Sturdy", "Training", "Infused", "Bloodthirsty", "Arcane", "Robust", "Precise", "Defending", "Powered", "Nirnhoned", "Charged", "Sharpened"];

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

export const setById = new Map(sets.map((s) => [s.id, s]));

export const allLines = (() => {
  const seen = new Map<string, string>();
  for (const s of skills) {
    if (s.className) seen.set(`${s.className}/${s.line}`, `${s.className[0].toUpperCase()}${s.className.slice(1)} — ${s.lineLabel}`);
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }));
})();

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

export function encodeState(s: PlannerState): string {
  return encodeURIComponent(btoa(JSON.stringify(s)));
}

export function decodeState(raw: string): PlannerState | null {
  try {
    return sanitizeState(JSON.parse(atob(decodeURIComponent(raw))));
  } catch {
    return null;
  }
}

/**
 * The `b` query param is user-controlled input. Rebuild a well-formed state
 * from it, keeping only ids that exist in the entity database — a crafted
 * URL must degrade to a partial build, never crash the page.
 */
export function sanitizeState(parsed: unknown): PlannerState | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const className = o.className as ClassName;
  if (!ALL_CLASSES.includes(className)) return null;

  const strings = (v: unknown, keep: (s: string) => boolean, max: number): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && keep(x)).slice(0, max)
      : [];

  const isLine = (s: string) => allLines.some((l) => l.id === s);
  const isActive = (s: string) => skills.some((sk) => sk.id === s && !sk.ultimate);
  const isUlt = (v: unknown): v is string =>
    typeof v === "string" && skills.some((sk) => sk.id === v && sk.ultimate);
  const cpIn = (tree: CpTree) => (s: string) =>
    cpStars.some((c) => c.id === s && c.tree === tree && c.slottable);

  const gear: GearAssignment[] = [];
  if (Array.isArray(o.gear)) {
    for (const raw of o.gear.slice(0, GEAR_SLOTS.length * 2)) {
      if (!raw || typeof raw !== "object") continue;
      const g = raw as Record<string, unknown>;
      const slot = g.slot as GearSlot;
      if (!GEAR_SLOTS.includes(slot)) continue;
      if (typeof g.setId !== "string" || !setById.has(g.setId)) continue;
      if (gear.some((existing) => existing.slot === slot)) continue;
      const trait = typeof g.trait === "string" && TRAITS.includes(g.trait) ? g.trait : "Divines";
      gear.push({ slot, setId: g.setId, trait });
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
      warfare: strings(cp.warfare, cpIn("warfare"), 4),
      fitness: strings(cp.fitness, cpIn("fitness"), 4),
      craft: strings(cp.craft, cpIn("craft"), 4),
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
