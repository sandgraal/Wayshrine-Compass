import { describe, expect, it } from "vitest";
import { sets } from "@/data/sets";
import { cpStars } from "@/data/cpStars";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { buildBySlug } from "@/data/builds";
import { BASE_STATS, computeStats } from "./validate";
import { DPS_MODEL, estimateDps, type DpsBonusInput } from "./dps";

const setById = new Map(sets.map((s) => [s.id, s]));

/** Assemble estimateDps inputs from a seed build the same way the planner UI does. */
function estimateForBuild(slug: string) {
  const build = buildBySlug.get(slug)!;
  const mundus = mundusStones.find((m) => m.id === build.mundusId)?.stats ?? [];
  const food = foods.find((f) => f.id === build.foodId)?.stats ?? [];
  const stats = computeStats(build.gear, setById, [mundus, food]);
  const bonuses: DpsBonusInput[] = [
    ...stats.activeBonuses.map((b) => ({
      source: `${b.setName} (${b.pieces}pc)`,
      effect: b.effect,
      structured: (b.stats?.length ?? 0) > 0,
    })),
    ...[...build.cp.warfare, ...build.cp.fitness, ...build.cp.craft]
      .map((id) => cpStars.find((s) => s.id === id))
      .filter((s) => s !== undefined)
      .map((s) => ({ source: `${s.name} (CP)`, effect: s.effect })),
  ];
  return { stats, estimate: estimateDps(stats.totals, bonuses) };
}

describe("planner DPS estimate", () => {
  it("is deterministic: identical inputs give identical estimates", () => {
    const a = estimateForBuild("sorcerer-dps");
    const b = estimateForBuild("sorcerer-dps");
    expect(a.estimate).toEqual(b.estimate);
  });

  it("produces a plausible mid-tier parse for a full seed DPS loadout", () => {
    const { estimate } = estimateForBuild("sorcerer-dps");
    // Calibration acceptance band for the rotation coefficient — not game truth.
    expect(estimate.dps).toBeGreaterThan(30_000);
    expect(estimate.dps).toBeLessThan(90_000);
    expect(estimate.low).toBeLessThan(estimate.dps);
    expect(estimate.high).toBeGreaterThan(estimate.dps);
  });

  it("rounds to the nearest 100 to avoid false precision", () => {
    const { estimate } = estimateForBuild("sorcerer-dps");
    for (const n of [estimate.dps, estimate.low, estimate.high]) expect(n % 100).toBe(0);
  });

  it("a geared build always beats the naked baseline", () => {
    const naked = estimateDps(BASE_STATS);
    for (const slug of ["sorcerer-dps", "dragonknight-dps", "arcanist-dps"]) {
      expect(estimateForBuild(slug).estimate.dps).toBeGreaterThan(naked.dps);
    }
  });

  it("more Weapon/Spell Damage means more DPS", () => {
    const base = estimateDps(BASE_STATS);
    const buffed = estimateDps({ ...BASE_STATS, weaponSpellDamage: BASE_STATS.weaponSpellDamage + 1000 });
    expect(buffed.dps).toBeGreaterThan(base.dps);
  });

  it("penetration helps only up to the target's resistance", () => {
    const base = estimateDps(BASE_STATS);
    const capped = estimateDps({ ...BASE_STATS, penetration: DPS_MODEL.targetResistance });
    const over = estimateDps({ ...BASE_STATS, penetration: DPS_MODEL.targetResistance + 10_000 });
    expect(capped.dps).toBeGreaterThan(base.dps);
    expect(over.dps).toBe(capped.dps);
  });

  it("crit chance is clamped at 100%", () => {
    const atCap = estimateDps({ ...BASE_STATS, criticalChance: DPS_MODEL.critRatingFor100Pct });
    const overCap = estimateDps({ ...BASE_STATS, criticalChance: DPS_MODEL.critRatingFor100Pct * 2 });
    expect(overCap.dps).toBe(atCap.dps);
  });

  it("applies rotation-scoped percent bonuses at the assumed uptime", () => {
    const base = estimateDps(BASE_STATS);
    const withPct = estimateDps(BASE_STATS, [
      { source: "Deadly Aim (CP)", effect: "Increases damage done with single target attacks by 10%." },
    ]);
    expect(withPct.breakdown.damageDoneMultiplier).toBeCloseTo(1 + 0.1 * DPS_MODEL.conditionalDamageUptime, 5);
    expect(withPct.dps).toBeGreaterThan(base.dps);
    expect(withPct.notModeled).toEqual([]);
  });

  it("parses unstructured flat bonuses instead of ignoring them", () => {
    const base = estimateDps(BASE_STATS);
    const parsed = estimateDps(BASE_STATS, [
      { source: "Datamined Set (2pc)", effect: "Adds 25-1096 Maximum Stamina" },
    ]);
    expect(parsed.notModeled).toEqual([]);
    expect(parsed.dps).toBeGreaterThan(base.dps);
  });

  it("never re-counts bonuses computeStats already applied as structured stats", () => {
    const base = estimateDps(BASE_STATS);
    const structured = estimateDps(BASE_STATS, [
      { source: "Deadly Strike (2pc)", effect: "Adds 657 Critical Chance", structured: true },
    ]);
    expect(structured.dps).toBe(base.dps);
    expect(structured.notModeled).toEqual([]);
  });

  it("lists unparseable bonuses as not modeled, contributing 0", () => {
    const base = estimateDps(BASE_STATS);
    const proc = {
      source: "Ansuul's Torment (5pc)",
      effect: "Casting an ability with a cast or channel time grants you a damage bonus for 10 seconds",
    };
    const withProc = estimateDps(BASE_STATS, [proc]);
    expect(withProc.dps).toBe(base.dps);
    expect(withProc.notModeled).toEqual([{ source: proc.source, effect: proc.effect }]);
  });

  it("surfaces the model's uncertainty band", () => {
    const { estimate } = estimateForBuild("sorcerer-dps");
    expect(estimate.low).toBeCloseTo(Math.round((estimate.dps * (1 - DPS_MODEL.errorBand)) / 100) * 100, -3);
    expect(estimate.high).toBeGreaterThan(estimate.dps * 1.1);
  });
});
