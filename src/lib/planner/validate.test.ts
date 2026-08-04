import { describe, expect, it } from "vitest";
import type { GearAssignment } from "@/lib/types";
import { sets } from "@/data/sets";
import { builds } from "@/data/builds";
import { computeStats, validateGear, validateSubclassLines } from "./validate";

const setById = new Map(sets.map((s) => [s.id, s]));

function fullLoadout(bodySet: string, jewelrySet: string, headShoulders: string): GearAssignment[] {
  return [
    { slot: "head", setId: headShoulders, trait: "Divines" },
    { slot: "shoulders", setId: headShoulders, trait: "Divines" },
    { slot: "chest", setId: bodySet, trait: "Divines" },
    { slot: "hands", setId: bodySet, trait: "Divines" },
    { slot: "waist", setId: bodySet, trait: "Divines" },
    { slot: "legs", setId: bodySet, trait: "Divines" },
    { slot: "feet", setId: bodySet, trait: "Divines" },
    { slot: "necklace", setId: jewelrySet, trait: "Bloodthirsty" },
    { slot: "ring1", setId: jewelrySet, trait: "Bloodthirsty" },
    { slot: "ring2", setId: jewelrySet, trait: "Bloodthirsty" },
    { slot: "frontBarWeapon", setId: jewelrySet, trait: "Precise" },
    { slot: "backBarWeapon", setId: jewelrySet, trait: "Infused" },
  ];
}

describe("planner validation", () => {
  it("accepts a standard legal 5/5/2 loadout", () => {
    const gear = fullLoadout("set-deadly-strike", "set-orders-wrath", "set-slimecraw");
    expect(validateGear(gear, setById).filter((i) => i.severity === "error")).toEqual([]);
  });

  it("flags a mythic worn in the wrong slot", () => {
    const gear: GearAssignment[] = [
      // Velothi is a necklace mythic — put it on a ring
      { slot: "ring1", setId: "set-velothi-ur-mages-amulet", trait: "Bloodthirsty" },
    ];
    const issues = validateGear(gear, setById);
    expect(issues.some((i) => i.code === "mythic-wrong-slot")).toBe(true);
  });

  it("flags two mythics at once", () => {
    const gear: GearAssignment[] = [
      { slot: "necklace", setId: "set-velothi-ur-mages-amulet", trait: "Bloodthirsty" },
      { slot: "ring1", setId: "set-oakensoul-ring", trait: "Bloodthirsty" },
    ];
    const issues = validateGear(gear, setById);
    expect(issues.some((i) => i.code === "multiple-mythics")).toBe(true);
  });

  it("flags two 5-piece sets plus a mythic when the mythic's slot is double-booked", () => {
    // Both 5-pieces use jewelry+weapons, so the necklace is taken — then Velothi
    // (a necklace mythic) cannot legally fit.
    const gear = [
      ...fullLoadout("set-deadly-strike", "set-orders-wrath", "set-deadly-strike"),
      { slot: "necklace" as const, setId: "set-velothi-ur-mages-amulet", trait: "Bloodthirsty" },
    ];
    const issues = validateGear(gear, setById);
    expect(issues.some((i) => i.code === "duplicate-slot")).toBe(true);
    expect(issues.some((i) => i.code === "mythic-slot-conflict")).toBe(true);
  });

  it("enforces subclassing rules: line cap and native-line minimum", () => {
    expect(
      validateSubclassLines("sorcerer", [
        "sorcerer/dark-magic",
        "nightblade/assassination",
        "templar/aedric-spear",
        "warden/animal-companions",
      ]).some((i) => i.code === "too-many-lines")
    ).toBe(true);

    expect(
      validateSubclassLines("sorcerer", [
        "nightblade/assassination",
        "templar/aedric-spear",
        "warden/animal-companions",
      ]).some((i) => i.code === "no-native-line")
    ).toBe(true);

    expect(
      validateSubclassLines("sorcerer", [
        "sorcerer/dark-magic",
        "nightblade/assassination",
        "sorcerer/storm-calling",
      ])
    ).toEqual([]);
  });

  it("computes stats from active set bonuses", () => {
    const gear = fullLoadout("set-deadly-strike", "set-orders-wrath", "set-slimecraw");
    const { totals, activeBonuses } = computeStats(gear, setById);
    // Deadly 2+4 (657*2 crit) + Order's 2+4 (657*2) + Slimecraw 1pc (657) = 3285 over base
    expect(totals.criticalChance).toBe(2190 + 657 * 5);
    // Both 5-piece bonuses active
    expect(activeBonuses.filter((b) => b.pieces === 5)).toHaveLength(2);
  });

  it("every seed build is legal", () => {
    for (const build of builds) {
      const errors = validateGear(build.gear, setById).filter((i) => i.severity === "error");
      expect(errors, `${build.slug}: ${errors.map((e) => e.message).join("; ")}`).toEqual([]);
      const lineErrors = validateSubclassLines(build.className, build.subclassLines);
      expect(lineErrors, build.slug).toEqual([]);
    }
  });
});

describe("computeStats with live-catalog bonuses (tooltip text only)", () => {
  it("recovers flat deltas from bonus text when no structured stats exist", () => {
    // Datamined shape: { pieces, effect } with no stats field, level-scaled range.
    const liveSet = {
      id: "set-live",
      name: "Whorl of the Depths",
      type: "trial" as const,
      bonuses: [
        { pieces: 2, effect: "Adds 25-1096 Maximum Magicka" },
        { pieces: 3, effect: "Adds 15-657 Critical Chance" },
      ],
    };
    const gear = [
      { slot: "head" as const, setId: "set-live", trait: "Divines" },
      { slot: "chest" as const, setId: "set-live", trait: "Divines" },
      { slot: "legs" as const, setId: "set-live", trait: "Divines" },
    ];
    const { totals, activeBonuses } = computeStats(gear, new Map([["set-live", liveSet]]));
    expect(totals.maxMagicka).toBe(12000 + 1096);
    expect(totals.criticalChance).toBe(2190 + 657);
    // Parsed deltas ride on the entry so the DPS estimator sees it as
    // structured and never double-counts.
    for (const b of activeBonuses) {
      expect(b.stats && b.stats.length > 0).toBe(true);
    }
  });

  it("leaves conditional live bonuses unparsed rather than guessing", () => {
    const liveSet = {
      id: "set-cond",
      name: "Conditional",
      type: "trial" as const,
      bonuses: [{ pieces: 2, effect: "Adds 6-300 Weapon and Spell Damage while your Health is above 50%." }],
    };
    const gear = [
      { slot: "head" as const, setId: "set-cond", trait: "Divines" },
      { slot: "chest" as const, setId: "set-cond", trait: "Divines" },
    ];
    const { totals, activeBonuses } = computeStats(gear, new Map([["set-cond", liveSet]]));
    expect(totals.weaponSpellDamage).toBe(1000);
    expect(activeBonuses[0].stats ?? []).toEqual([]);
  });
});
