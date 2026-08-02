import { describe, expect, it } from "vitest";
import type { Build, PatchDataset } from "@/lib/types";
import { affectedBuilds, diffDatasets } from "./diff";
import { runIngest } from "./pipeline";
import { computeFreshness } from "@/lib/freshness";

/* ------------------------------------------------------------------ */
/* Synthetic patch datasets (Phase 1 acceptance)                       */
/* ------------------------------------------------------------------ */

const setDef = (id: string, name: string, fifth: string) => ({
  id,
  name,
  type: "trial" as const,
  source: "Synthetic Trial",
  dlcRequired: null,
  bonuses: [
    { pieces: 2, effect: "Adds 657 Critical Chance" },
    { pieces: 5, effect: fifth },
  ],
});

const skillDef = (id: string, name: string, desc: string) => ({
  id,
  className: "sorcerer" as const,
  line: "dark-magic",
  lineLabel: "Dark Magic",
  name,
  ultimate: false,
  description: desc,
  morphs: [
    { name: `${name} A`, description: "a" },
    { name: `${name} B`, description: "b" },
  ],
});

const starDef = (id: string, name: string, effect: string) => ({
  id,
  tree: "warfare" as const,
  name,
  effect,
  slottable: true,
});

const synthU50: PatchDataset = {
  patch: { id: "patch-u50", code: "U50", name: "Update 50", releasedAt: "2026-06-08", season: "Season 1" },
  sets: [
    setDef("set-alpha", "Alpha's Embrace", "Deal 500 extra flame damage"),
    setDef("set-beta", "Beta Ward", "Gain a 5000 damage shield"),
    setDef("set-gamma", "Gamma's Edge", "Increase crit damage by 10%"),
  ],
  skills: [
    skillDef("skill-frag", "Crystal Fragments", "Deals 2000 magic damage"),
    skillDef("skill-curse", "Daedric Curse", "Explodes after 6 seconds"),
  ],
  cpStars: [starDef("cp-alpha-aim", "Alpha Aim", "10% single target damage")],
};

const synthU51: PatchDataset = {
  patch: { id: "patch-u51", code: "U51", name: "Update 51", releasedAt: "2026-09-07", season: "Season 2" },
  sets: [
    // Alpha changed: 5pc bonus nerfed
    setDef("set-alpha", "Alpha's Embrace", "Deal 400 extra flame damage"),
    // Beta unchanged
    setDef("set-beta", "Beta Ward", "Gain a 5000 damage shield"),
    // Gamma removed; Delta added
    setDef("set-delta", "Delta's Gift", "Restore 300 magicka on kill"),
  ],
  skills: [
    // Crystal Fragments changed: damage number
    skillDef("skill-frag", "Crystal Fragments", "Deals 1800 magic damage"),
    // Curse unchanged
    skillDef("skill-curse", "Daedric Curse", "Explodes after 6 seconds"),
  ],
  cpStars: [starDef("cp-alpha-aim", "Alpha Aim", "10% single target damage")],
};

const buildUsing = (id: string, setIds: string[], skillIds: string[]): Build => ({
  id,
  slug: id,
  name: id,
  className: "sorcerer",
  subclassLines: ["sorcerer/dark-magic"],
  role: "dps",
  contentType: "trial",
  author: "test",
  status: "verified",
  patchVerified: "U50",
  gear: setIds.map((setId, i) => ({ slot: i === 0 ? "chest" : "necklace", setId, trait: "Divines" })),
  frontBar: { skills: skillIds, ultimate: skillIds[0] },
  backBar: { skills: skillIds, ultimate: skillIds[0] },
  cp: { warfare: ["cp-alpha-aim"], fitness: [], craft: [] },
  mundusId: "mundus-shadow",
  foodId: "food-x",
  guidance: [],
  needsReviewReasons: [],
});

describe("diff engine (synthetic patch data)", () => {
  it("produces a correct list of changed entities between consecutive patches", () => {
    const report = diffDatasets(synthU50, synthU51);
    const byKey = new Map(report.changes.map((c) => [`${c.entityType}:${c.entityId}`, c]));

    expect(byKey.get("set:set-alpha")?.kind).toBe("changed");
    expect(byKey.get("set:set-alpha")?.changedFields).toContain("bonuses");
    expect(byKey.get("set:set-gamma")?.kind).toBe("removed");
    expect(byKey.get("set:set-delta")?.kind).toBe("added");
    expect(byKey.get("skill:skill-frag")?.kind).toBe("changed");

    // Unchanged entities must NOT appear
    expect(byKey.has("set:set-beta")).toBe(false);
    expect(byKey.has("skill:skill-curse")).toBe(false);
    expect(byKey.has("cp_star:cp-alpha-aim")).toBe(false);

    expect(report.changes).toHaveLength(4);
  });

  it("flags every build referencing a changed entity, and only those", () => {
    const report = diffDatasets(synthU50, synthU51);

    const usesChangedSet = buildUsing("b-alpha", ["set-alpha"], ["skill-curse"]);
    const usesChangedSkill = buildUsing("b-frag", ["set-beta"], ["skill-frag"]);
    const usesNothingChanged = buildUsing("b-clean", ["set-beta"], ["skill-curse"]);
    const usesRemovedSet = buildUsing("b-gamma", ["set-gamma"], ["skill-curse"]);

    const affected = affectedBuilds(report, [usesChangedSet, usesChangedSkill, usesNothingChanged, usesRemovedSet]);
    const ids = affected.map((a) => a.buildId).sort();

    expect(ids).toEqual(["b-alpha", "b-frag", "b-gamma"]);

    const alpha = affected.find((a) => a.buildId === "b-alpha")!;
    expect(alpha.changes).toHaveLength(1);
    expect(alpha.changes[0].entityId).toBe("set-alpha");
  });

  it("ingest pipeline stamps provenance and marks affected builds needs_review", () => {
    // Seed the store from U50 (everything first seen / last changed at U50)
    const seeded = runIngest({ sets: [], skills: [], cpStars: [] }, "U49", synthU50, []);
    expect(seeded.store.sets.every((s) => s.firstSeenPatch === "U50")).toBe(true);

    const b1 = buildUsing("b-alpha", ["set-alpha"], ["skill-curse"]);
    const b2 = buildUsing("b-clean", ["set-beta"], ["skill-curse"]);

    const result = runIngest(seeded.store, "U50", synthU51, [b1, b2]);

    // Provenance: changed entity stamped U51, unchanged keeps U50, new gets U51
    const alpha = result.store.sets.find((s) => s.id === "set-alpha")!;
    const beta = result.store.sets.find((s) => s.id === "set-beta")!;
    const delta = result.store.sets.find((s) => s.id === "set-delta")!;
    expect(alpha.lastChangedPatch).toBe("U51");
    expect(alpha.firstSeenPatch).toBe("U50");
    expect(beta.lastChangedPatch).toBe("U50");
    expect(delta.firstSeenPatch).toBe("U51");

    // Flagging: only the build referencing the changed set is flagged
    expect(result.flagged.map((b) => b.id)).toEqual(["b-alpha"]);
    expect(result.flagged[0].status).toBe("needs_review");
    expect(result.flagged[0].needsReviewReasons[0].entityName).toBe("Alpha's Embrace");
    expect(result.flagged[0].needsReviewReasons[0].summary).toContain("changed in U51");
  });

  it("computeFreshness derives amber/red badges from provenance", () => {
    const order = ["U49", "U50", "U51"];
    const provenance = {
      tracks: () => true,
      get: (_type: string, id: string) =>
        id === "set-alpha"
          ? { name: "Alpha's Embrace", lastChangedPatch: "U51" }
          : { name: id, lastChangedPatch: "U49" },
    };

    // Verified at U50, references an entity changed in U51 → needs_review
    const amber = computeFreshness(buildUsing("b1", ["set-alpha"], ["skill-curse"]), provenance, "U51", order);
    expect(amber.status).toBe("needs_review");
    expect(amber.reasons[0].entityName).toBe("Alpha's Embrace");

    // Verified at U50, nothing changed → verified even though a patch passed
    const green = computeFreshness(buildUsing("b2", ["set-beta"], ["skill-curse"]), provenance, "U51", order);
    expect(green.status).toBe("verified");

    // Two patches behind → stale regardless of references
    const staleBuild = { ...buildUsing("b3", ["set-beta"], ["skill-curse"]), patchVerified: "U49" };
    const red = computeFreshness(staleBuild, provenance, "U51", order);
    expect(red.status).toBe("stale");
  });

  it("a build referencing an entity removed from the game data goes amber, not verified", () => {
    const order = ["U50", "U51"];
    // set-gamma was removed in U51: the store no longer has it at all.
    const provenance = {
      tracks: (type: string) => ["set", "skill", "cp_star"].includes(type),
      get: (_type: string, id: string) =>
        id === "set-gamma" ? undefined : { name: id, lastChangedPatch: "U50" },
    };
    const amber = computeFreshness(buildUsing("b-gamma", ["set-gamma"], ["skill-curse"]), provenance, "U51", order);
    expect(amber.status).toBe("needs_review");
    expect(amber.reasons.some((r) => r.entityId === "set-gamma" && /removed/.test(r.summary))).toBe(true);

    // Untracked types (mundus/food in seed mode) must not trigger false alarms
    const clean = computeFreshness(buildUsing("b-clean", ["set-beta"], ["skill-curse"]), provenance, "U51", order);
    expect(clean.status).toBe("verified");
  });
});
