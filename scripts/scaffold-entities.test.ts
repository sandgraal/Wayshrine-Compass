import { describe, expect, it } from "vitest";
import {
  isSlottableSkill,
  matchLeadingStat,
  scaffoldSet,
  scaffoldSkill,
  type ArtifactSet,
  type ArtifactSkill,
} from "./scaffold-entities";

describe("matchLeadingStat", () => {
  it("parses a ranged flat stat to its max value and marks it pure", () => {
    expect(matchLeadingStat("Adds 25-1096 Maximum Magicka")).toEqual({
      stat: "maxMagicka",
      amount: 1096,
      statName: "Maximum Magicka",
      percent: false,
      pure: true,
    });
    expect(matchLeadingStat("Adds 34-1487 Offensive Penetration")).toMatchObject({
      stat: "penetration",
      amount: 1487,
      pure: true,
    });
    expect(matchLeadingStat("Adds 3460 Armor")).toMatchObject({ stat: "armor", amount: 3460, pure: true });
  });

  it("captures a percentage stat", () => {
    expect(matchLeadingStat("Adds 4% Healing Done")).toMatchObject({
      stat: "healingDone",
      amount: 4,
      percent: true,
      pure: true,
    });
  });

  it("marks a compound bonus impure but still recovers its leading stat", () => {
    const ls = matchLeadingStat("Adds 401 Weapon and Spell Damage, but increases the cost of your active abilities by 5%");
    expect(ls).toMatchObject({ stat: "weaponSpellDamage", amount: 401, pure: false });
  });

  it("returns null for procs and Minor/Major buffs (no leading flat stat)", () => {
    expect(matchLeadingStat("Gain Minor Slayer at all times, increasing your damage done by 5%.")).toBeNull();
    expect(matchLeadingStat("When an enemy you recently damaged dies, they leave behind a vengeful soul.")).toBeNull();
    expect(matchLeadingStat("Adds 424 Critical Resistance")).toBeNull(); // stat the seed does not model
  });
});

describe("isSlottableSkill", () => {
  it("is true for actives (has morphs) and ultimates, false for passives", () => {
    expect(isSlottableSkill({ ultimate: false, morphs: [{ name: "A", description: "" }] })).toBe(true);
    expect(isSlottableSkill({ ultimate: true, morphs: [] })).toBe(true);
    expect(isSlottableSkill({ ultimate: false, morphs: [] })).toBe(false);
  });
});

describe("scaffoldSkill", () => {
  const active: ArtifactSkill = {
    id: "skill-sorcerer-dark-magic-crystal-shard",
    name: "Crystal Shard",
    className: "sorcerer",
    line: "dark-magic",
    lineLabel: "Dark Magic",
    ultimate: false,
    description: "Conjure dark crystals to bombard an enemy, dealing damage. Extra sentence.",
    morphs: [
      { name: "Crystal Fragments", description: "" },
      { name: "Crystal Weapon", description: "" },
    ],
  };

  it("refuses a passive rather than scaffolding an un-slottable skill", () => {
    const passive: ArtifactSkill = { ...active, morphs: [], description: "Increases block mitigation." };
    expect(() => scaffoldSkill(passive)).toThrow(/passive/i);
  });

  it("emits a sk() call with the real line, morphs, and a description TODO", () => {
    const out = scaffoldSkill(active);
    expect(out).toContain('sk("sorcerer", "dark-magic", "Dark Magic", "Crystal Shard"');
    expect(out).toContain('morphs: ["Crystal Fragments", "Crystal Weapon"]');
    expect(out).toContain("TODO original one-line summary");
    // reference line paraphrases from the first sentence only, never the full tooltip
    expect(out).toContain("// ref");
    expect(out).not.toContain("Extra sentence");
  });

  it("flags the ultimate flag", () => {
    expect(scaffoldSkill({ ...active, ultimate: true })).toContain("ult: true,");
  });
});

describe("scaffoldSet", () => {
  const set: ArtifactSet = {
    id: "set-mothers-sorrow",
    name: "Mother's Sorrow",
    type: "overland",
    source: "Deshaan",
    dlcRequired: null,
    bonuses: [
      { pieces: 2, effect: "Adds 25-1096 Maximum Magicka" },
      { pieces: 5, effect: "Adds 35-1528 Critical Chance" },
      { pieces: 3, effect: "Adds 15-657 Critical Chance" },
    ],
  };

  it("auto-fills flat bonuses with the right helper and sorts by piece count", () => {
    const out = scaffoldSet(set);
    expect(out).toContain('b(2, "Adds 1096 Maximum Magicka", [mag(1096)]),');
    expect(out).toContain('b(3, "Adds 657 Critical Chance", [crit(657)]),');
    expect(out).toContain('b(5, "Adds 1528 Critical Chance", [crit(1528)]),');
    // sorted: the 3-piece line comes before the 5-piece line
    expect(out.indexOf('b(3,')).toBeLessThan(out.indexOf('b(5,'));
  });

  it("leaves procs as TODO with a paraphrase reference, no fabricated stat", () => {
    const procSet: ArtifactSet = {
      ...set,
      id: "set-example",
      bonuses: [{ pieces: 5, effect: "When you deal damage, unleash a burst of Flame Damage." }],
    };
    const out = scaffoldSet(procSet);
    expect(out).toContain('b(5, "TODO paraphrase"),');
    expect(out).toContain("// ref");
  });
});
