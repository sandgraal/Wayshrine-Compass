import { describe, expect, it } from "vitest";
import type { Build } from "@/lib/types";
import { patches } from "@/data/patches";
import { buildDb, type DbData } from "./core";

/**
 * The conditional-tracking gate for the newer entity types: an empty
 * grimoire/script/mastery collection means the data source predates their
 * ingest, and freshness must not treat every reference as "removed" — that
 * would mass-amber all builds in the window between applying migration 0004
 * and the first ingest that populates the tables.
 */

const build: Build = {
  id: "b",
  slug: "b",
  name: "B",
  className: "sorcerer",
  subclassLines: ["sorcerer/dark-magic"],
  role: "dps",
  contentType: "trial",
  author: "test",
  status: "verified",
  patchVerified: "U50",
  gear: [],
  frontBar: { skills: ["skill-x"], ultimate: "skill-x" },
  backBar: { skills: [], ultimate: "skill-x" },
  cp: { warfare: [], fitness: [], craft: [] },
  mundusId: "mundus-shadow",
  foodId: "food-x",
  guidance: [],
  needsReviewReasons: [],
};

const baseData: DbData = {
  source: "seed",
  patches,
  sets: [],
  skills: [
    {
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
    },
  ],
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

const masteryLine = {
  id: "mastery-sorcerer-storm-calling",
  name: "Storm Calling (Sorcerer)",
  className: "sorcerer" as const,
  line: "storm-calling",
  lineLabel: "Storm Calling",
  graftable: true,
  firstSeenPatch: "U48",
  lastChangedPatch: "U48",
};

describe("buildDb tracking of Scribing / Class Mastery types", () => {
  it("does not amber a mastery ref while the collection is empty (pre-ingest window)", () => {
    const db = buildDb(baseData);
    expect(db.freshness(build).status).toBe("verified");
  });

  it("ambers a mastery ref missing from a populated collection as removed", () => {
    // The collection carries data but not the referenced line → real removal.
    const db = buildDb({ ...baseData, classMasteryLines: [masteryLine] });
    const freshness = db.freshness(build);
    expect(freshness.status).toBe("needs_review");
    expect(
      freshness.reasons.some(
        (r) => r.entityId === "mastery-sorcerer-dark-magic" && /removed/.test(r.summary)
      )
    ).toBe(true);
  });

  it("ambers a build whose referenced mastery line changed after verification", () => {
    const changed = {
      ...masteryLine,
      id: "mastery-sorcerer-dark-magic",
      name: "Dark Magic (Sorcerer)",
      line: "dark-magic",
      lineLabel: "Dark Magic",
      lastChangedPatch: "U50",
    };
    const db = buildDb({ ...baseData, classMasteryLines: [changed] });
    const amber = db.freshness({ ...build, patchVerified: "U49" });
    expect(amber.status).toBe("needs_review");
    expect(amber.reasons[0].entityName).toBe("Dark Magic (Sorcerer)");
    // Verified at the change patch → green again.
    expect(db.freshness(build).status).toBe("verified");
  });
});
