import { describe, expect, it } from "vitest";
import { parsePatchDataset } from "./parse";

const validSet = {
  id: "set-a",
  name: "Alpha's Embrace",
  type: "trial",
  source: "Synthetic Trial",
  dlcRequired: null,
  bonuses: [{ pieces: 2, effect: "Adds 657 Critical Chance" }],
};

const validSkill = {
  id: "skill-a",
  className: "sorcerer",
  line: "dark-magic",
  lineLabel: "Dark Magic",
  name: "Crystal Shard",
  ultimate: false,
  description: "Conjure a crystal shard.",
  morphs: [
    { name: "Crystal Fragments", description: "a" },
    { name: "Crystal Weapon", description: "b" },
  ],
};

const validStar = {
  id: "cp-a",
  tree: "warfare",
  name: "Deadly Aim",
  effect: "10% single target damage",
  slottable: true,
};

const validGrimoire = {
  id: "grimoire-a",
  name: "Wield Soul",
  line: "soul-magic",
  lineLabel: "Soul Magic",
  description: "Launch a concentrated blast of soul magic.",
  acquisition: "Obtained from the Scholarium.",
  dlcRequired: "gold-road",
  focusScripts: ["script-a"],
  signatureScripts: [],
  affixScripts: [],
};

const validScript = {
  id: "script-a",
  name: "Physical Damage",
  slot: "focus",
  description: "Adds physical damage to a scribed skill.",
  acquisition: "Acquired from daily quests.",
};

const validMasteryLine = {
  id: "mastery-sorcerer-dark-magic",
  name: "Dark Magic (Sorcerer)",
  className: "sorcerer",
  line: "dark-magic",
  lineLabel: "Dark Magic",
  graftable: true,
};

const valid = {
  patch: { code: "U51", releasedAt: "2026-09-07" },
  sets: [validSet],
  skills: [validSkill],
  cpStars: [validStar],
  grimoires: [validGrimoire],
  scripts: [validScript],
  classMasteryLines: [validMasteryLine],
};

describe("parsePatchDataset", () => {
  it("accepts a valid dataset and fills patch defaults", () => {
    const parsed = parsePatchDataset(valid);
    expect(parsed).not.toBeNull();
    expect(parsed!.patch).toEqual({
      id: "patch-u51",
      code: "U51",
      name: "U51",
      releasedAt: "2026-09-07",
      season: null,
    });
    expect(parsed!.sets).toHaveLength(1);
  });

  it("rejects a patch without a valid ISO release date (ordering would corrupt freshness)", () => {
    expect(parsePatchDataset({ ...valid, patch: { code: "U51" } })).toBeNull();
    expect(parsePatchDataset({ ...valid, patch: { code: "U51", releasedAt: "soon" } })).toBeNull();
    expect(parsePatchDataset({ ...valid, patch: { code: "U51", releasedAt: "" } })).toBeNull();
  });

  it("rejects structurally invalid envelopes", () => {
    expect(parsePatchDataset(null)).toBeNull();
    expect(parsePatchDataset("string")).toBeNull();
    expect(parsePatchDataset({})).toBeNull();
    expect(parsePatchDataset({ ...valid, sets: "nope" })).toBeNull();
  });

  it("rejects entities missing schema-required fields", () => {
    // id-only set (the exact payload from review) must not pass
    expect(parsePatchDataset({ ...valid, sets: [{ id: "x" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, sets: [{ ...validSet, name: "" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, sets: [{ ...validSet, type: "legendary" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, sets: [{ ...validSet, bonuses: [{ pieces: "5" }] }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, skills: [{ ...validSkill, morphs: [{}] }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, skills: [{ ...validSkill, ultimate: "yes" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, cpStars: [{ ...validStar, tree: "combat" }] })).toBeNull();
  });

  it("requires the Scribing and Class Mastery collections (a legacy payload must not pass)", () => {
    for (const key of ["grimoires", "scripts", "classMasteryLines"]) {
      const without: Record<string, unknown> = { ...valid };
      delete without[key];
      expect(parsePatchDataset(without), `missing ${key}`).toBeNull();
    }
  });

  it("rejects invalid Scribing / Class Mastery entities", () => {
    expect(parsePatchDataset({ ...valid, grimoires: [{ id: "x" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, grimoires: [{ ...validGrimoire, focusScripts: [1] }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, scripts: [{ ...validScript, slot: "tertiary" }] })).toBeNull();
    expect(parsePatchDataset({ ...valid, classMasteryLines: [{ ...validMasteryLine, graftable: "yes" }] })).toBeNull();
  });

  it("preserves explicit patch metadata", () => {
    const parsed = parsePatchDataset({
      ...valid,
      patch: { id: "patch-x", code: "U51", name: "Update 51", releasedAt: "2026-09-07", season: "Season 2" },
    });
    expect(parsed!.patch.name).toBe("Update 51");
    expect(parsed!.patch.id).toBe("patch-x");
    expect(parsed!.patch.season).toBe("Season 2");
  });
});
