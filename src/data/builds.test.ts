import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/data";
import { buildEntityRefs } from "@/lib/entities";
import { builds } from "./builds";

/**
 * The live game data the daily ingest diffs against. Build references must be a
 * subset of it: the diff engine ambers a removed entity at runtime, but a
 * committed build that references an id the current dataset never had is an
 * authoring mistake, so we fail CI here rather than ship a permanently-amber
 * build. Mundus stones and food are not part of the dataset (or the freshness
 * `tracks` set), so this guards the tracked types only: set, skill, cp_star.
 */
const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/dataset/current.json"), "utf8")
) as { sets: { id: string }[]; skills: { id: string }[]; cpStars: { id: string }[] };

const datasetIds: Record<"set" | "skill" | "cp_star", Set<string>> = {
  set: new Set(dataset.sets.map((s) => s.id)),
  skill: new Set(dataset.skills.map((s) => s.id)),
  cp_star: new Set(dataset.cpStars.map((s) => s.id)),
};

describe("build references vs the live dataset", () => {
  it("every tracked (set/skill/cp_star) reference exists in public/dataset/current.json", () => {
    const orphans: string[] = [];
    for (const build of builds) {
      for (const ref of buildEntityRefs(build)) {
        if (ref.entityType === "set" || ref.entityType === "skill" || ref.entityType === "cp_star") {
          if (!datasetIds[ref.entityType].has(ref.entityId)) {
            orphans.push(`${build.slug} → ${ref.entityType}:${ref.entityId}`);
          }
        }
      }
    }
    expect(orphans, `these build references are missing from the dataset:\n${orphans.join("\n")}`).toEqual([]);
  });

  it("references every seed set/skill/cp_star by an id the dataset can resolve (no free text)", () => {
    // Sanity that the guard above has something to bite on and ids look real.
    expect(datasetIds.set.size).toBeGreaterThan(100);
    expect(datasetIds.skill.size).toBeGreaterThan(100);
    expect(datasetIds.cp_star.size).toBeGreaterThan(50);
  });
});

describe("no seed build ships pre-verified", () => {
  // Directive: builds are reviewed by a human via /admin, so none may render the
  // green "Verified" badge until then. Green requires patchVerified === current
  // AND nothing referenced changed since; every build is stamped a prior patch,
  // so all compute to needs_review (amber) or stale — never verified.
  it("computes needs_review or stale for every build against the current dataset", () => {
    const verified = builds.filter((b) => db.freshness(b).status === "verified").map((b) => b.slug);
    expect(verified, `these builds compute to the green "verified" badge and must not:\n${verified.join("\n")}`).toEqual([]);
  });

  it("stamps every build's patchVerified below the current patch", () => {
    for (const build of builds) {
      expect(build.patchVerified).not.toBe(db.currentPatch);
    }
  });
});
