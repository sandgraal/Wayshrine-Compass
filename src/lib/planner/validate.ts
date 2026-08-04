import type { GearAssignment, GearSet, StatDelta } from "@/lib/types";

/** The slice of a set the validators and stat math read — callers may pass
 * full GearSets or the planner's slim shapes. */
export type GearSetLike = Pick<GearSet, "id" | "name" | "type" | "bonuses" | "mythicSlot">;
import { GEAR_SLOTS } from "@/lib/types";

/**
 * Planner legality validation + stat computation (Phase 5).
 * Pure functions so the planner UI and tests share one implementation.
 */

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

/** How many subclass lines a build may use in total (native + borrowed). */
export const MAX_SKILL_LINES = 3;
/** At least one native class line must remain (U46 subclassing rule). */
export const MIN_NATIVE_LINES = 1;

export function validateSubclassLines(
  className: string,
  subclassLines: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (subclassLines.length > MAX_SKILL_LINES) {
    issues.push({
      severity: "error",
      code: "too-many-lines",
      message: `A character can slot at most ${MAX_SKILL_LINES} class skill lines; this build lists ${subclassLines.length}.`,
    });
  }
  const native = subclassLines.filter((l) => l.startsWith(`${className}/`)).length;
  if (subclassLines.length > 0 && native < MIN_NATIVE_LINES) {
    issues.push({
      severity: "error",
      code: "no-native-line",
      message: "Subclassing requires keeping at least one of your own class's skill lines.",
    });
  }
  const dupes = subclassLines.filter((l, i) => subclassLines.indexOf(l) !== i);
  if (dupes.length > 0) {
    issues.push({
      severity: "error",
      code: "duplicate-line",
      message: `Duplicate skill line: ${dupes[0]}.`,
    });
  }
  return issues;
}

export function validateGear(
  gear: GearAssignment[],
  setById: Map<string, GearSetLike>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Slot sanity: each slot at most once, only known slots
  const seenSlots = new Set<string>();
  for (const g of gear) {
    if (!GEAR_SLOTS.includes(g.slot)) {
      issues.push({ severity: "error", code: "unknown-slot", message: `Unknown gear slot: ${g.slot}.` });
    }
    if (seenSlots.has(g.slot)) {
      issues.push({ severity: "error", code: "duplicate-slot", message: `Slot ${g.slot} is assigned twice.` });
    }
    seenSlots.add(g.slot);
  }

  // Piece counts per set
  const counts = new Map<string, number>();
  for (const g of gear) counts.set(g.setId, (counts.get(g.setId) ?? 0) + 1);

  const mythics: string[] = [];
  for (const [setId, count] of counts) {
    const set = setById.get(setId);
    if (!set) {
      issues.push({ severity: "error", code: "unknown-set", message: `Unknown set id: ${setId}.` });
      continue;
    }
    if (set.type === "mythic") {
      mythics.push(setId);
      if (count > 1) {
        issues.push({
          severity: "error",
          code: "mythic-multiple-pieces",
          message: `${set.name} is a Mythic and occupies exactly one slot; ${count} are assigned.`,
        });
      }
      const assignment = gear.find((g) => g.setId === setId)!;
      if (set.mythicSlot && assignment.slot !== set.mythicSlot) {
        issues.push({
          severity: "error",
          code: "mythic-wrong-slot",
          message: `${set.name} can only be worn in the ${set.mythicSlot} slot, not ${assignment.slot}.`,
        });
      }
    }
    if (set.type === "monster" && count > 2) {
      issues.push({
        severity: "error",
        code: "monster-too-many",
        message: `${set.name} is a two-piece monster set; ${count} pieces are assigned.`,
      });
    }
    const maxBonus = Math.max(...set.bonuses.map((b) => b.pieces));
    if (count > maxBonus + 1 && set.type !== "crafted") {
      issues.push({
        severity: "warning",
        code: "wasted-pieces",
        message: `${set.name}: ${count} pieces equipped but bonuses cap at ${maxBonus}.`,
      });
    }
  }

  if (mythics.length > 1) {
    issues.push({
      severity: "error",
      code: "multiple-mythics",
      message: "Only one Mythic item can be equipped at a time.",
    });
  }

  // The classic illegal ask: two full 5-piece sets plus a mythic needs 11 non-mythic
  // slots for the 5-pieces and 1 for the mythic — fine — but two 5-piece sets plus a
  // mythic AND a monster set cannot fit in 12 slots. General rule: total pieces ≤ 12.
  const totalPieces = gear.length;
  if (totalPieces > GEAR_SLOTS.length) {
    issues.push({
      severity: "error",
      code: "too-many-pieces",
      message: `${totalPieces} pieces assigned but only ${GEAR_SLOTS.length} slots exist.`,
    });
  }

  // Two 5-piece sets + mythic where a 5-piece claims the mythic's required slot
  if (mythics.length === 1) {
    const mythicSet = setById.get(mythics[0])!;
    if (mythicSet.mythicSlot) {
      const claimants = gear.filter((g) => g.slot === mythicSet.mythicSlot && g.setId !== mythics[0]);
      if (claimants.length > 0) {
        issues.push({
          severity: "error",
          code: "mythic-slot-conflict",
          message: `${mythicSet.name} needs the ${mythicSet.mythicSlot} slot, which is also assigned to another set.`,
        });
      }
    }
  }

  return issues;
}

/* ------------------------------------------------------------------ */
/* Stat computation                                                    */
/* ------------------------------------------------------------------ */

/** CP160 level-50 naked baseline (approximate live values). */
export const BASE_STATS: Record<StatDelta["stat"], number> = {
  maxMagicka: 12000,
  maxStamina: 12000,
  maxHealth: 16000,
  weaponSpellDamage: 1000,
  criticalChance: 2190, // 10%
  criticalDamage: 50,
  penetration: 0,
  armor: 0,
  healingDone: 0,
  magickaRecovery: 514,
  staminaRecovery: 514,
  healthRecovery: 514,
};

export interface ComputedStats {
  totals: Record<StatDelta["stat"], number>;
  /** Which set bonuses are active at the equipped piece counts. `stats` is the
   * structured portion already folded into `totals` — consumers (the DPS
   * estimator) use its presence to avoid double-counting a bonus. */
  activeBonuses: { setName: string; pieces: number; effect: string; stats?: StatDelta[] }[];
}

export function computeStats(
  gear: GearAssignment[],
  setById: Map<string, GearSetLike>,
  extras: StatDelta[][] = [] // mundus, food, etc.
): ComputedStats {
  const totals = { ...BASE_STATS };
  const activeBonuses: ComputedStats["activeBonuses"] = [];

  const counts = new Map<string, number>();
  for (const g of gear) counts.set(g.setId, (counts.get(g.setId) ?? 0) + 1);

  for (const [setId, count] of counts) {
    const set = setById.get(setId);
    if (!set) continue;
    for (const bonus of set.bonuses) {
      if (bonus.pieces <= count) {
        activeBonuses.push({ setName: set.name, pieces: bonus.pieces, effect: bonus.effect, stats: bonus.stats });
        for (const delta of bonus.stats ?? []) {
          totals[delta.stat] += delta.amount;
        }
      }
    }
  }

  for (const group of extras) {
    for (const delta of group) totals[delta.stat] += delta.amount;
  }

  return { totals, activeBonuses };
}
