import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractEffect } from "./bonus-extract";

describe("bonus text extractor", () => {
  it("parses a plain flat bonus (seed wording)", () => {
    expect(extractEffect("Adds 657 Critical Chance")).toEqual({
      kind: "flat",
      deltas: [{ stat: "criticalChance", amount: 657 }],
    });
  });

  it("takes the CP160 end of a level-scaling range", () => {
    expect(extractEffect("Adds 25-1096 Maximum Stamina")).toEqual({
      kind: "flat",
      deltas: [{ stat: "maxStamina", amount: 1096 }],
    });
  });

  it("parses compound clauses without splitting 'Weapon and Spell Damage'", () => {
    expect(extractEffect("Adds 129 Weapon and Spell Damage and 28-1240 Offensive Penetration")).toEqual({
      kind: "flat",
      deltas: [
        { stat: "weaponSpellDamage", amount: 129 },
        { stat: "penetration", amount: 1240 },
      ],
    });
  });

  it("parses the crit-chance-plus-crit-damage combo tail", () => {
    expect(extractEffect("Adds 877 Critical Chance and increases your Critical Damage by 0-4%")).toEqual({
      kind: "flat",
      deltas: [
        { stat: "criticalChance", amount: 877 },
        { stat: "criticalDamage", amount: 4 },
      ],
    });
  });

  it("parses 'Increases X by N' seed CP/mundus wording", () => {
    expect(extractEffect("Increases Armor by 1980.")).toEqual({
      kind: "flat",
      deltas: [{ stat: "armor", amount: 1980 }],
    });
    expect(extractEffect("Increases Maximum Health by 1560.")).toEqual({
      kind: "flat",
      deltas: [{ stat: "maxHealth", amount: 1560 }],
    });
  });

  it("parses percent critical damage", () => {
    expect(extractEffect("Increases Critical Damage and Critical Healing by 8%.")).toEqual({
      kind: "flat",
      deltas: [{ stat: "criticalDamage", amount: 8 }],
    });
  });

  it("classifies rotation-scoped damage percents", () => {
    expect(extractEffect("Increases damage done with single target attacks by 10%.")).toEqual({
      kind: "damage-pct",
      scope: "single target attacks",
      pct: 10,
    });
    expect(extractEffect("Increases damage of your damage-over-time and channeled abilities by 15%")).toEqual({
      kind: "damage-pct",
      scope: "damage-over-time and channeled abilities",
      pct: 15,
    });
  });

  it("refuses conditional flat bonuses", () => {
    expect(extractEffect("Gain 35-1505 Health Recovery while you are standing still.")).toBeNull();
    expect(extractEffect("Adds 300-1237 Weapon and Spell Damage while your Health is above 50%")).toBeNull();
    expect(extractEffect("Adds 25-1096 Critical Chance to your Class abilities")).toBeNull();
  });

  it("refuses conditional or multi-sentence percent bonuses", () => {
    expect(extractEffect("Increases Critical Damage against flanked targets by 10%.")).toBeNull();
    expect(
      extractEffect(
        "Increases your damage done with Frost abilities by 8%. Increases your damage done against Chilled enemies by 4%."
      )
    ).toBeNull();
  });

  it("refuses proc and stack mechanics", () => {
    expect(
      extractEffect("Casting an ability with a cast or channel time grants you a damage bonus for 10 seconds")
    ).toBeNull();
    expect(extractEffect("Increases Weapon and Spell Damage by up to 740 based on missing Stamina")).toBeNull();
  });

  // Acceptance sweep over the real U50 dataset artifact: the extractor must be
  // tolerant (never throw) and keep covering the flat-stat majority. The floor
  // is intentionally below the current count (1,445 of 2,302) so routine
  // dataset refreshes don't break the build, while a parser regression does.
  it("covers the U50 dataset without throwing", () => {
    const dataset = JSON.parse(readFileSync(join(process.cwd(), "public/dataset/current.json"), "utf8")) as {
      sets: { bonuses: { effect: string }[] }[];
    };
    const effects = dataset.sets.flatMap((s) => s.bonuses.map((b) => b.effect));
    expect(effects.length).toBeGreaterThan(2000);

    let parsed = 0;
    for (const effect of effects) {
      const result = extractEffect(effect); // must not throw on any real string
      if (result) parsed += 1;
      if (result?.kind === "flat") {
        for (const d of result.deltas) {
          expect(Number.isFinite(d.amount)).toBe(true);
          expect(d.amount).toBeGreaterThanOrEqual(0);
        }
      }
    }
    expect(parsed).toBeGreaterThan(1200);
  });
});
