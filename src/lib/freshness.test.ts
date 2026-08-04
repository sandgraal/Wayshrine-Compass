import { describe, expect, it } from "vitest";
import type { Build, Skill } from "@/lib/types";
import { patches } from "@/data/patches";
import { buildDb, type DbData } from "./data/core";
import { entityChangeStatus, TRACKING_BASELINE_PATCH } from "./freshness";

/**
 * Signal-integrity acceptance tests. The first full-catalog ingest stamped
 * every datamined entity firstSeen === lastChanged === U50; treating that as
 * "changed in U50" would amber the entire database at once — the exact
 * freshness theater the badge system exists to avoid. Only an observed diff
 * (lastChanged > firstSeen) may claim a change.
 */

const PATCH_ORDER = patches.map((p) => p.code);

describe("entityChangeStatus", () => {
  it("reads a baseline-import stamp as tracked, not changed", () => {
    expect(
      entityChangeStatus(
        { firstSeenPatch: TRACKING_BASELINE_PATCH, lastChangedPatch: TRACKING_BASELINE_PATCH },
        PATCH_ORDER
      )
    ).toEqual({ kind: "tracked", patch: TRACKING_BASELINE_PATCH });
  });

  it("reads a pre-baseline unchanged entity as tracked since first seen", () => {
    expect(entityChangeStatus({ firstSeenPatch: "U48", lastChangedPatch: "U48" }, PATCH_ORDER)).toEqual({
      kind: "tracked",
      patch: "U48",
    });
  });

  it("reads a post-baseline first appearance as added", () => {
    expect(
      entityChangeStatus({ firstSeenPatch: "U51", lastChangedPatch: "U51" }, [...PATCH_ORDER, "U51"])
    ).toEqual({ kind: "added", patch: "U51" });
  });

  it("reads lastChanged after firstSeen as the only provable change", () => {
    expect(entityChangeStatus({ firstSeenPatch: "U48", lastChangedPatch: "U50" }, PATCH_ORDER)).toEqual({
      kind: "changed",
      patch: "U50",
    });
  });

  it("never claims a change from out-of-order provenance stamps", () => {
    // firstSeen AFTER lastChanged is corrupt data; a change cannot have been
    // observed, so the conservative reading is tracked, not amber.
    expect(entityChangeStatus({ firstSeenPatch: "U50", lastChangedPatch: "U49" }, PATCH_ORDER)).toEqual({
      kind: "tracked",
      patch: "U50",
    });
  });

  it("still reads a stamp newer than the patch table as changed", () => {
    // Unknown codes can't be ordered; raw inequality keeps a genuinely newer
    // stamp visible instead of silently masking it.
    expect(entityChangeStatus({ firstSeenPatch: "U48", lastChangedPatch: "U51" }, PATCH_ORDER)).toEqual({
      kind: "changed",
      patch: "U51",
    });
  });
});

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: "skill-x",
    className: "sorcerer",
    line: "dark-magic",
    lineLabel: "Dark Magic",
    name: "Crystal Shard",
    ultimate: false,
    description: "",
    morphs: [],
    firstSeenPatch: "U48",
    lastChangedPatch: "U48",
    ...overrides,
  };
}

function makeBuild(patchVerified: string): Build {
  return {
    id: "b",
    slug: "b",
    name: "B",
    className: "sorcerer",
    subclassLines: [],
    role: "dps",
    contentType: "trial",
    author: "test",
    status: "verified",
    patchVerified,
    gear: [],
    frontBar: { skills: ["skill-x"], ultimate: "skill-x" },
    backBar: { skills: [], ultimate: "skill-x" },
    cp: { warfare: [], fitness: [], craft: [] },
    mundusId: "mundus-shadow",
    foodId: "food-x",
    guidance: [],
    needsReviewReasons: [],
  };
}

function dbWith(skill: Skill, build: Build, extraPatches: DbData["patches"] = []): ReturnType<typeof buildDb> {
  const data: DbData = {
    source: "seed",
    patches: [...patches, ...extraPatches],
    sets: [],
    skills: [skill],
    cpStars: [],
    grimoires: [],
    scripts: [],
    classMasteryLines: [],
    companions: [],
    mundusStones: [],
    foods: [],
    zones: [],
    builds: [build],
  };
  return buildDb(data);
}

describe("computeFreshness reason wording", () => {
  it("says a baseline-stamped entity entered tracking, never that it changed", () => {
    const db = dbWith(
      makeSkill({ firstSeenPatch: "U50", lastChangedPatch: "U50" }),
      makeBuild("U49")
    );
    const freshness = db.freshness(db.builds[0]);
    expect(freshness.status).toBe("needs_review");
    expect(freshness.reasons).toHaveLength(1);
    const reason = freshness.reasons[0];
    expect(reason.summary).toContain("entered tracking with the U50 catalog import");
    expect(reason.summary).not.toContain("changed in");
    // Invariant: amber always names the exact entity and patch.
    expect(reason.entityName).toBe("Crystal Shard");
    expect(reason.patch).toBe("U50");
  });

  it("keeps the changed wording for an observed diff", () => {
    const db = dbWith(
      makeSkill({ firstSeenPatch: "U48", lastChangedPatch: "U50" }),
      makeBuild("U49")
    );
    const freshness = db.freshness(db.builds[0]);
    expect(freshness.status).toBe("needs_review");
    expect(freshness.reasons[0].summary).toContain("Crystal Shard changed in U50");
  });

  it("says a post-baseline entity was added, naming its patch", () => {
    const db = dbWith(
      makeSkill({ firstSeenPatch: "U51", lastChangedPatch: "U51" }),
      makeBuild("U50"),
      [{ id: "patch-u51", code: "U51", name: "Update 51", releasedAt: "2026-09-01", season: null }]
    );
    const freshness = db.freshness(db.builds[0]);
    expect(freshness.status).toBe("needs_review");
    expect(freshness.reasons[0].summary).toContain("was added in U51");
    expect(freshness.reasons[0].patch).toBe("U51");
  });

  it("stays verified when the referenced entity predates the review unchanged", () => {
    const db = dbWith(
      makeSkill({ firstSeenPatch: "U48", lastChangedPatch: "U48" }),
      makeBuild("U50")
    );
    expect(db.freshness(db.builds[0]).status).toBe("verified");
  });
});
