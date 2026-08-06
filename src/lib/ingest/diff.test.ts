import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Build, PatchDataset, Skill } from "@/lib/types";
import { affectedBuilds, diffDatasets } from "./diff";
import { runIngest } from "./pipeline";
import { parsePatchDataset } from "./parse";
import { computeFreshness, type ProvenanceIndex } from "@/lib/freshness";
import { skills as seedSkills } from "@/data/skills";

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
  grimoires: [],
  scripts: [],
  classMasteryLines: [],
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
  grimoires: [],
  scripts: [],
  classMasteryLines: [],
};

const buildUsing =(id: string, setIds: string[], skillIds: string[]): Build => ({
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
  gear: setIds.map((setId, i) => ({ slot: i === 0 ? "chest" : "necklace", setId, trait: "Divines", enchant: "" })),
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

  it("emits old-to-new fieldDiffs for changed entities, capped in length", () => {
    const report = diffDatasets(synthU50, synthU51);
    const alpha = report.changes.find((c) => c.entityId === "set-alpha");
    expect(alpha?.fieldDiffs).toBeDefined();
    const bonuses = alpha!.fieldDiffs!.find((d) => d.field === "bonuses");
    expect(bonuses).toBeDefined();
    expect(bonuses!.before).not.toBe(bonuses!.after);
    for (const d of alpha!.fieldDiffs!) {
      expect(d.before.length).toBeLessThanOrEqual(240);
      expect(d.after.length).toBeLessThanOrEqual(240);
    }
    // Additions and removals carry no per-field diff.
    expect(report.changes.find((c) => c.entityId === "set-delta")?.fieldDiffs).toBeUndefined();
    expect(report.changes.find((c) => c.entityId === "set-gamma")?.fieldDiffs).toBeUndefined();
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
    const seeded = runIngest(
      { sets: [], skills: [], cpStars: [], grimoires: [], scripts: [], classMasteryLines: [] },
      "U49",
      synthU50,
      []
    );
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

  it("diffs and flags across the Scribing and Class Mastery collections", () => {
    const grimoire = {
      id: "grimoire-wield-soul",
      name: "Wield Soul",
      line: "soul-magic",
      lineLabel: "Soul Magic",
      description: "Launch a blast of soul magic.",
      acquisition: "Scholarium quest.",
      dlcRequired: "gold-road",
      focusScripts: ["script-flame"],
      signatureScripts: [],
      affixScripts: [],
    };
    const script = {
      id: "script-flame",
      name: "Flame Damage",
      slot: "focus" as const,
      description: "Adds flame damage.",
      acquisition: "Daily quests.",
    };
    const mastery = {
      id: "mastery-sorcerer-dark-magic",
      name: "Dark Magic (Sorcerer)",
      className: "sorcerer" as const,
      line: "dark-magic",
      lineLabel: "Dark Magic",
      graftable: true,
    };
    const prev: PatchDataset = { ...synthU50, grimoires: [grimoire], scripts: [script], classMasteryLines: [mastery] };
    const next: PatchDataset = {
      ...synthU51,
      grimoires: [{ ...grimoire, description: "Launch a stronger blast of soul magic." }],
      scripts: [script],
      classMasteryLines: [mastery],
    };

    const report = diffDatasets(prev, next);
    const grimChange = report.changes.find((c) => c.entityType === "grimoire");
    expect(grimChange?.kind).toBe("changed");
    expect(grimChange?.changedFields).toEqual(["description"]);
    expect(report.changes.some((c) => c.entityType === "script")).toBe(false);
    expect(report.changes.some((c) => c.entityType === "mastery_line")).toBe(false);

    // A build scribing the changed grimoire is flagged; its bar-twin without
    // scribing is not. subclassLines refs ride along untouched (no change).
    const scribed = {
      ...buildUsing("b-scribed", ["set-beta"], ["skill-curse"]),
      scribedSkills: [{ grimoireId: "grimoire-wield-soul", scriptIds: ["script-flame"] }],
    };
    const plain = buildUsing("b-plain", ["set-beta"], ["skill-curse"]);
    const affected = affectedBuilds(report, [scribed, plain]);
    expect(affected.map((a) => a.buildId)).toEqual(["b-scribed"]);

    // Pipeline stamps the new collections like the old ones.
    const store = runIngest(
      { sets: [], skills: [], cpStars: [], grimoires: [], scripts: [], classMasteryLines: [] },
      "U49",
      prev,
      []
    ).store;
    const result = runIngest(store, "U50", next, [scribed, plain]);
    expect(result.store.grimoires[0].firstSeenPatch).toBe("U50");
    expect(result.store.grimoires[0].lastChangedPatch).toBe("U51");
    expect(result.store.scripts[0].lastChangedPatch).toBe("U50");
    expect(result.store.classMasteryLines[0].lastChangedPatch).toBe("U50");
    expect(result.flagged.map((b) => b.id)).toEqual(["b-scribed"]);
    expect(result.flagged[0].needsReviewReasons[0].entityName).toBe("Wield Soul");
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

/* ------------------------------------------------------------------ */
/* Rename detection (synthetic)                                         */
/* ------------------------------------------------------------------ */

const skillWith = (
  id: string,
  name: string,
  opts: {
    line?: string;
    desc?: string;
    morphs?: string[];
    gameId?: string;
    className?: Skill["className"];
  } = {}
) => ({
  id,
  className: opts.className ?? ("necromancer" as const),
  line: opts.line ?? "grave-lord",
  lineLabel: "Grave Lord",
  name,
  ultimate: false,
  description: opts.desc ?? "",
  morphs: (opts.morphs ?? ["Morph A", "Morph B"]).map((m) => ({ name: m, description: m })),
  ...(opts.gameId ? { gameId: opts.gameId } : {}),
});

const dataset = (code: string, skills: ReturnType<typeof skillWith>[]): PatchDataset => ({
  patch: { id: `patch-${code.toLowerCase()}`, code, name: code, releasedAt: "2026-01-01", season: null },
  sets: [],
  skills: skills as unknown as PatchDataset["skills"],
  cpStars: [],
  grimoires: [],
  scripts: [],
  classMasteryLines: [],
});

describe("rename detection (synthetic)", () => {
  it("pairs a removed id with a near-identical added id via shared morph tokens", () => {
    const prev = dataset("U49", [
      skillWith("skill-necromancer-grave-lord-blastbones", "Blastbones", {
        desc: "Summon a skeleton that charges the enemy and explodes.",
        morphs: ["Blighted Blastbones", "Stalking Blastbones"],
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-necromancer-grave-lord-sacrificial-bones", "Sacrificial Bones", {
        desc: "Summon a skeleton that leaps to you, sacrificing itself.",
        morphs: ["Blighted Blastbones", "Grave Lord's Sacrifice"],
      }),
    ]);
    const report = diffDatasets(prev, next);

    // One change: the rename. Not a removed + an added.
    expect(report.changes).toHaveLength(1);
    const c = report.changes[0];
    expect(c.kind).toBe("renamed");
    expect(c.entityId).toBe("skill-necromancer-grave-lord-blastbones");
    expect(c.entityName).toBe("Blastbones");
    expect(c.renamedTo).toEqual({
      entityId: "skill-necromancer-grave-lord-sacrificial-bones",
      entityName: "Sacrificial Bones",
    });
  });

  it("treats a shared stable gameId as definitive, even when text differs", () => {
    const prev = dataset("U49", [
      skillWith("skill-sorcerer-dark-magic-old-name", "Old Name", {
        className: "sorcerer",
        line: "dark-magic",
        desc: "does one thing",
        morphs: ["Alpha", "Beta"],
        gameId: "998877",
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-sorcerer-dark-magic-new-name", "New Name", {
        className: "sorcerer",
        line: "dark-magic",
        desc: "does a completely different thing",
        morphs: ["Gamma", "Delta"],
        gameId: "998877",
      }),
    ]);
    const report = diffDatasets(prev, next);
    expect(report.changes).toHaveLength(1);
    expect(report.changes[0].kind).toBe("renamed");
    expect(report.changes[0].renamedTo?.entityId).toBe("skill-sorcerer-dark-magic-new-name");
  });

  it("does NOT pair when gameIds differ, however similar the text", () => {
    const prev = dataset("U49", [
      skillWith("skill-sorcerer-dark-magic-twin-a", "Twin Strike", {
        className: "sorcerer",
        line: "dark-magic",
        desc: "identical prose here",
        morphs: ["Shared Morph", "Shared Morph"],
        gameId: "111",
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-sorcerer-dark-magic-twin-b", "Twin Strike", {
        className: "sorcerer",
        line: "dark-magic",
        desc: "identical prose here",
        morphs: ["Shared Morph", "Shared Morph"],
        gameId: "222",
      }),
    ]);
    const report = diffDatasets(prev, next);
    const kinds = report.changes.map((c) => c.kind).sort();
    expect(kinds).toEqual(["added", "removed"]);
  });

  it("does NOT invent a rename when nothing overlaps (stays removed + added)", () => {
    const prev = dataset("U49", [
      skillWith("skill-necromancer-grave-lord-alpha", "Searing Bolt", {
        desc: "channels alpha energy at a foe",
        morphs: ["Molten Lance", "Kindled Spear"],
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-necromancer-grave-lord-zeta", "Frost Coil", {
        desc: "unleashes zeta waves outward",
        morphs: ["Void Grasp", "Rimefang Snare"],
      }),
    ]);
    const report = diffDatasets(prev, next);
    const byKind = new Map(report.changes.map((c) => [c.entityId, c.kind]));
    expect(byKind.get("skill-necromancer-grave-lord-alpha")).toBe("removed");
    expect(byKind.get("skill-necromancer-grave-lord-zeta")).toBe("added");
  });

  it("mutual-best-match: two removals cannot both claim one addition", () => {
    const prev = dataset("U49", [
      skillWith("skill-necromancer-grave-lord-strong", "Strong Match", {
        // Morphs are a strict superset of successor's — Jaccard/overlap
        // scores are identical for both candidates, so neither qualifies
        // (tie → abstain).  A second test below covers the unambiguous case.
        morphs: ["Shared Morph", "Unique Extra"],
      }),
      skillWith("skill-necromancer-grave-lord-weak", "Weak Match", {
        morphs: ["Shared Morph"],
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-necromancer-grave-lord-successor", "Successor", {
        morphs: ["Shared Morph", "Unique Extra"],
      }),
    ]);
    const report = diffDatasets(prev, next);
    const byId = new Map(report.changes.map((c) => [c.entityId, c]));
    // Tied scores → both candidates abstain (no arbitrary first-wins rename).
    expect(byId.get("skill-necromancer-grave-lord-strong")?.kind).toBe("removed");
    expect(byId.get("skill-necromancer-grave-lord-weak")?.kind).toBe("removed");
    // The successor is emitted as a plain addition.
    expect(byId.get("skill-necromancer-grave-lord-successor")?.kind).toBe("added");
  });

  it("mutual-best-match: unambiguous winner is paired, weaker candidate stays removed", () => {
    const prev = dataset("U49", [
      skillWith("skill-necromancer-grave-lord-strong", "Strong Match", {
        // Shares a morph NOT present in weak → strictly higher morph overlap.
        morphs: ["Shared Morph", "Exclusive Extra"],
      }),
      skillWith("skill-necromancer-grave-lord-weak", "Weak Match", {
        morphs: ["Shared Morph", "Unrelated Morph"],
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-necromancer-grave-lord-successor", "Successor", {
        morphs: ["Shared Morph", "Exclusive Extra"],
      }),
    ]);
    const report = diffDatasets(prev, next);
    const byId = new Map(report.changes.map((c) => [c.entityId, c]));
    // The stronger overlap wins the pairing...
    expect(byId.get("skill-necromancer-grave-lord-strong")?.kind).toBe("renamed");
    // ...and the weaker removal stays a plain removal (no double-claim).
    expect(byId.get("skill-necromancer-grave-lord-weak")?.kind).toBe("removed");
    // The successor is emitted once (the rename), never also as an add.
    expect(byId.has("skill-necromancer-grave-lord-successor")).toBe(false);
  });

  it("pipeline records the supersession and flags the build with a precise reason", () => {
    const prev = dataset("U49", [
      skillWith("skill-necromancer-grave-lord-blastbones", "Blastbones", {
        morphs: ["Blighted Blastbones", "Stalking Blastbones"],
      }),
    ]);
    const next = dataset("U50", [
      skillWith("skill-necromancer-grave-lord-sacrificial-bones", "Sacrificial Bones", {
        morphs: ["Blighted Blastbones", "Grave Lord's Sacrifice"],
      }),
    ]);
    const build = buildUsing("b-bones", [], ["skill-necromancer-grave-lord-blastbones"]);
    // Seed the store from U49, then ingest U50 against it.
    const seeded = runIngest({ sets: [], skills: [], cpStars: [], grimoires: [], scripts: [], classMasteryLines: [] }, "U48", prev, []).store;
    const run = runIngest(seeded, "U49", next, [build]);

    expect(run.supersessions).toEqual([
      {
        entityType: "skill",
        oldId: "skill-necromancer-grave-lord-blastbones",
        oldName: "Blastbones",
        newId: "skill-necromancer-grave-lord-sacrificial-bones",
        newName: "Sacrificial Bones",
        patch: "U50",
      },
    ]);
    const flagged = run.flagged.find((b) => b.id === "b-bones")!;
    expect(flagged.status).toBe("needs_review");
    expect(flagged.needsReviewReasons[0].summary).toContain('Blastbones was renamed/reworked in U50 (now "Sacrificial Bones")');
  });

  it("freshness names the successor for a build stuck on the old id (amber, never rewritten)", () => {
    const order = ["U49", "U50"];
    const provenance: ProvenanceIndex = {
      tracks: (t) => ["set", "skill", "cp_star"].includes(t),
      get: (_t, id) =>
        id === "skill-old-renamed" || id === "skill-old-moved"
          ? undefined
          : { name: id, lastChangedPatch: "U49" },
      supersededBy: (t, id) => {
        if (t !== "skill") return undefined;
        if (id === "skill-old-renamed")
          return { oldName: "Blastbones", newId: "skill-new", newName: "Sacrificial Bones", patch: "U50" };
        if (id === "skill-old-moved")
          return { oldName: "Veiled Strike", newId: "skill-nb-assassination-veiled-strike", newName: "Veiled Strike", patch: "U50" };
        return undefined;
      },
    };

    const renamed = computeFreshness(
      buildUsing("b1", ["set-beta"], ["skill-old-renamed"]),
      provenance,
      "U50",
      order
    );
    expect(renamed.status).toBe("needs_review");
    const r1 = renamed.reasons.find((r) => r.entityId === "skill-old-renamed")!;
    expect(r1.entityName).toBe("Blastbones");
    expect(r1.summary).toContain('Blastbones was renamed/reworked in U50 (now "Sacrificial Bones")');

    // Same-name id move (Veiled Strike changed skill lines): name the new id.
    const moved = computeFreshness(
      buildUsing("b2", ["set-beta"], ["skill-old-moved"]),
      provenance,
      "U50",
      order
    );
    const r2 = moved.reasons.find((r) => r.entityId === "skill-old-moved")!;
    expect(r2.summary).toContain("now id skill-nb-assassination-veiled-strike");
  });
});

/* ------------------------------------------------------------------ */
/* Rename detection against the real U50 dataset                       */
/*                                                                     */
/* The store still holds the seed skills; the U50 dataset renamed four  */
/* of them (a fifth, Blastbones -> Sacrificial Bones, was already       */
/* reconciled by id in the seed, so it matches and never appears here). */
/* Only two of the four carry enough continuity (morph + name tokens)   */
/* to name a successor confidently; the other two are genuinely         */
/* ambiguous and must stay "removed" rather than get a fabricated one.   */
/* ------------------------------------------------------------------ */

describe("rename detection (real U50 dataset vs seed skills)", () => {
  const file = path.resolve(process.cwd(), "public", "dataset", "current.json");
  const u50 = parsePatchDataset(JSON.parse(fs.readFileSync(file, "utf8")))!;
  const seedAsDataset: PatchDataset = {
    patch: { id: "patch-seed", code: "U49", name: "seed", releasedAt: "2026-01-01", season: null },
    sets: [],
    skills: seedSkills,
    cpStars: [],
    grimoires: [],
    scripts: [],
    classMasteryLines: [],
  };
  const report = diffDatasets(seedAsDataset, u50);
  const byKey = new Map(report.changes.map((c) => [`${c.entityType}:${c.entityId}`, c]));

  it("detects the morph/name-continuous renames (Veiled Strike line move, Fiery Breath rework)", () => {
    const veiled = byKey.get("skill:skill-nightblade-shadow-veiled-strike");
    expect(veiled?.kind).toBe("renamed");
    expect(veiled?.renamedTo?.entityId).toBe("skill-nightblade-assassination-veiled-strike");

    const fiery = byKey.get("skill:skill-dragonknight-ardent-flame-fiery-breath");
    expect(fiery?.kind).toBe("renamed");
    expect(fiery?.renamedTo?.entityId).toBe("skill-dragonknight-draconic-power-dragonfire-breath");
    expect(fiery?.renamedTo?.entityName).toBe("Dragonfire Breath");
  });

  it("does not fabricate a successor for the genuinely ambiguous removals", () => {
    // Their guessed candidates (landslide, burnished-scales) share no morph or
    // name tokens with the old skill, so a rename would be a wrong guess.
    expect(byKey.get("skill:skill-dragonknight-earthen-heart-stonefist")?.kind).toBe("removed");
    expect(byKey.get("skill:skill-dragonknight-draconic-power-spiked-armor")?.kind).toBe("removed");
  });

  it("emits each successor once (as the rename), not also as a bare addition", () => {
    expect(byKey.get("skill:skill-nightblade-assassination-veiled-strike")).toBeUndefined();
    expect(byKey.get("skill:skill-dragonknight-draconic-power-dragonfire-breath")).toBeUndefined();
  });

  it("flags a build on the renamed-away id amber, naming the successor, and records it", () => {
    const build = buildUsing("b-veil", [], ["skill-nightblade-shadow-veiled-strike"]);
    const run = runIngest({ sets: [], skills: seedSkills, cpStars: [], grimoires: [], scripts: [], classMasteryLines: [] }, "U49", u50, [build]);

    const flagged = run.flagged.find((b) => b.id === "b-veil")!;
    expect(flagged.status).toBe("needs_review");
    const reason = flagged.needsReviewReasons.find(
      (r) => r.entityId === "skill-nightblade-shadow-veiled-strike"
    );
    expect(reason?.summary).toContain("renamed/reworked in U50");
    expect(reason?.summary).toContain("skill-nightblade-assassination-veiled-strike");

    expect(run.supersessions).toContainEqual(
      expect.objectContaining({
        entityType: "skill",
        oldId: "skill-nightblade-shadow-veiled-strike",
        newId: "skill-nightblade-assassination-veiled-strike",
        patch: "U50",
      })
    );
  });
});
