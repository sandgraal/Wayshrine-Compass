import type { StatDelta } from "@/lib/types";
import { extractEffect } from "./bonus-extract";

/**
 * Rough sustained-DPS estimate for a planner draft (deferred v1 item).
 *
 * Deterministic pure function — no LLM, no randomness, no network (the What
 * Next invariant extends here). It is a MODEL, not a parse: the UI must always
 * present the result as an estimate ("±15% — model, not a parse") and never as
 * verified data. Every constant below is an explicit assumption, surfaced to
 * the UI via `dpsAssumptions()`.
 */
export const DPS_MODEL = {
  /** Trial target dummy resistance; penetration beyond this is wasted. */
  targetResistance: 18200,
  /** ESO mitigation: unpenetrated resistance reduces damage by resist/50000. */
  resistanceDivisor: 50_000,
  /** Critical rating that equals 100% crit chance at CP160 (219.12 per 1%). */
  critRatingFor100Pct: 21_912,
  /** Max resource converts to damage at ~1/10.46 the rate of Weapon/Spell Damage (tooltip scaling). */
  resourceToPowerDivisor: 10.46,
  /**
   * Baseline rotation coefficient: sustained damage per second per point of
   * effective power, assuming a competent single-target light-attack-weave
   * rotation with full uptime on slotted abilities. Calibrated so a complete
   * seed DPS loadout lands in a mid-tier dummy-parse range (~50–70k).
   */
  rotationCoefficient: 21,
  /**
   * Rotation-scoped "+N% damage" bonuses (single target / DoT / AoE / class
   * abilities…) are assumed to cover half the rotation's damage.
   */
  conditionalDamageUptime: 0.5,
  /** Presented uncertainty band. */
  errorBand: 0.15,
} as const;

/** One effect feeding the model: an active set bonus or a slotted CP star. */
export interface DpsBonusInput {
  /** Player-facing origin, e.g. "Deadly Strike (5pc)" or "Deadly Aim (CP)". */
  source: string;
  effect: string;
  /** True when computeStats already applied this bonus as structured StatDeltas — never re-parsed (no double count). */
  structured?: boolean;
}

export interface DpsEstimate {
  /** Sustained single-target DPS, rounded to the nearest 100 to avoid false precision. */
  dps: number;
  /** dps ∓ errorBand, same rounding. */
  low: number;
  high: number;
  breakdown: {
    effectivePower: number;
    critChancePct: number;
    critMultiplier: number;
    penetrationMultiplier: number;
    damageDoneMultiplier: number;
  };
  /** Effects the extractor could not turn into numbers — they contribute 0 and the UI lists them. */
  notModeled: { source: string; effect: string }[];
}

const round100 = (n: number) => Math.round(n / 100) * 100;

export function estimateDps(
  totals: Record<StatDelta["stat"], number>,
  bonuses: DpsBonusInput[] = []
): DpsEstimate {
  const adjusted = { ...totals };
  const notModeled: DpsEstimate["notModeled"] = [];
  let damageDoneMultiplier = 1;

  for (const bonus of bonuses) {
    if (bonus.structured) continue; // already inside `totals`
    const extracted = extractEffect(bonus.effect);
    if (!extracted) {
      notModeled.push({ source: bonus.source, effect: bonus.effect });
    } else if (extracted.kind === "flat") {
      for (const delta of extracted.deltas) adjusted[delta.stat] += delta.amount;
    } else {
      damageDoneMultiplier *= 1 + (extracted.pct / 100) * DPS_MODEL.conditionalDamageUptime;
    }
  }

  const resource = Math.max(adjusted.maxMagicka, adjusted.maxStamina);
  const effectivePower = adjusted.weaponSpellDamage + resource / DPS_MODEL.resourceToPowerDivisor;

  const critChance = Math.min(Math.max(adjusted.criticalChance / DPS_MODEL.critRatingFor100Pct, 0), 1);
  const critMultiplier = 1 + critChance * (adjusted.criticalDamage / 100);

  const penetrated = Math.min(Math.max(adjusted.penetration, 0), DPS_MODEL.targetResistance);
  const penetrationMultiplier = 1 - (DPS_MODEL.targetResistance - penetrated) / DPS_MODEL.resistanceDivisor;

  const dps =
    DPS_MODEL.rotationCoefficient * effectivePower * critMultiplier * penetrationMultiplier * damageDoneMultiplier;

  return {
    dps: round100(dps),
    low: round100(dps * (1 - DPS_MODEL.errorBand)),
    high: round100(dps * (1 + DPS_MODEL.errorBand)),
    breakdown: {
      effectivePower: Math.round(effectivePower),
      critChancePct: Math.round(critChance * 1000) / 10,
      critMultiplier: Math.round(critMultiplier * 1000) / 1000,
      penetrationMultiplier: Math.round(penetrationMultiplier * 1000) / 1000,
      damageDoneMultiplier: Math.round(damageDoneMultiplier * 1000) / 1000,
    },
    notModeled,
  };
}

/** Human-readable assumption list for the UI — kept next to the constants it describes. */
export function dpsAssumptions(): string[] {
  return [
    `Single-target light-attack-weave rotation at full ability uptime (coefficient ${DPS_MODEL.rotationCoefficient} DPS per point of effective power).`,
    `Target: a ${DPS_MODEL.targetResistance.toLocaleString()}-resistance trial dummy; penetration past that is wasted.`,
    `Rotation-scoped "+N% damage" bonuses (single target, DoT, AoE…) assumed active on ${DPS_MODEL.conditionalDamageUptime * 100}% of your damage.`,
    `Max Magicka/Stamina converts to power at 1/${DPS_MODEL.resourceToPowerDivisor} the rate of Weapon/Spell Damage; crit rating ${DPS_MODEL.critRatingFor100Pct.toLocaleString()} = 100%.`,
    "Proc sets, buff uptimes, and execute phases are not simulated — unmodeled bonuses contribute 0 and are listed.",
  ];
}
