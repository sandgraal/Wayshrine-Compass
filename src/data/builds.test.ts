import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/data";
import { buildEntityRefs } from "@/lib/entities";
import { computeStats } from "@/lib/planner/validate";
import { estimateLoadoutDps } from "@/lib/planner/dps";
import { makeEntityTables, stateFromBuild } from "@/app/planner/planner-state";
import { ROLES, CONTENT } from "@/app/builds/filters";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { builds } from "./builds";
import { skillById as seedSkillById } from "./skills";

/**
 * The live game data the daily ingest diffs against. Build references must be a
 * subset of it: the diff engine ambers a removed entity at runtime, but a
 * committed build that references an id the current dataset never had is an
 * authoring mistake, so we fail CI here rather than ship a permanently-amber
 * build. Mundus stones and food are not part of the dataset (or the freshness
 * `tracks` set), so this guards the tracked types only: set, skill, cp_star.
 */
type DatasetSkill = { id: string; ultimate?: boolean; morphs?: unknown[] };
const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/dataset/current.json"), "utf8")
) as { sets: { id: string }[]; skills: DatasetSkill[]; cpStars: { id: string }[] };

const datasetIds: Record<"set" | "skill" | "cp_star", Set<string>> = {
  set: new Set(dataset.sets.map((s) => s.id)),
  skill: new Set(dataset.skills.map((s) => s.id)),
  cp_star: new Set(dataset.cpStars.map((s) => s.id)),
};

const datasetSkillById = new Map(dataset.skills.map((s) => [s.id, s]));

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

describe("no build slots a passive", () => {
  // The datamined skill list mixes actives, ultimates, and passives. A passive
  // has no morphs and is not an ultimate — it cannot be placed on an ability
  // bar. The seed treats every non-ultimate skill as slottable, so an authoring
  // mistake (modeling a passive as an active) would silently put an un-slottable
  // skill on a bar. Guard against it by checking the dataset's own shape.
  const isSlottable = (s?: DatasetSkill) =>
    !!s && (s.ultimate === true || (Array.isArray(s.morphs) && s.morphs.length > 0));

  it("every bar slot holds an active or ultimate (never a morph-less passive)", () => {
    const offenders: string[] = [];
    for (const build of builds) {
      for (const [label, slot] of [["front", build.frontBar], ["back", build.backBar]] as const) {
        for (const id of slot.skills) {
          if (!isSlottable(datasetSkillById.get(id))) offenders.push(`${build.slug} ${label} → ${id}`);
        }
        if (!isSlottable(datasetSkillById.get(slot.ultimate))) {
          offenders.push(`${build.slug} ${label} ultimate → ${slot.ultimate}`);
        }
      }
    }
    expect(offenders, `these bar slots hold a passive (no morphs) skill:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("every ultimate slot holds a skill the seed models as an ultimate", () => {
    // Checked against the seed's own model: the datamined artifact does not
    // flag weapon-line ultimates (e.g. Elemental Storm) with ultimate=true, so
    // this guards the build's internal consistency, not the artifact's flag.
    const offenders: string[] = [];
    for (const build of builds) {
      for (const slot of [build.frontBar, build.backBar]) {
        if (!seedSkillById.get(slot.ultimate)?.ultimate) offenders.push(`${build.slug} → ${slot.ultimate}`);
      }
    }
    expect(offenders, `these ultimate slots are not modeled as ultimates:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("computed stats surface (build page reuses the planner engine)", () => {
  it("computes finite stats and a positive DPS estimate for every build", () => {
    for (const build of builds) {
      const stats = computeStats(build.gear, db.setById, [
        db.mundusById.get(build.mundusId)?.stats ?? [],
        db.foodById.get(build.foodId)?.stats ?? [],
      ]);
      for (const [stat, value] of Object.entries(stats.totals)) {
        expect(Number.isFinite(value), `${build.slug} total ${stat}`).toBe(true);
      }
      const slottedCp = [...build.cp.warfare, ...build.cp.fitness, ...build.cp.craft]
        .map((id) => db.cpStarById.get(id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      const dps = estimateLoadoutDps(stats, slottedCp);
      expect(Number.isFinite(dps.dps), `${build.slug} dps`).toBe(true);
      expect(dps.dps, `${build.slug} dps`).toBeGreaterThan(0);
      expect(dps.low).toBeLessThanOrEqual(dps.dps);
      expect(dps.high).toBeGreaterThanOrEqual(dps.dps);
    }
  });

  // The build page and the planner are meant to show the *same* DPS for the
  // same loadout. They reach it by different routes: the build page resolves
  // CP stars, mundus, and food straight off the build via the db facade, while
  // the planner forks the build into draft state and resolves through the
  // entity tables it builds client-side. Reusing `estimateDps` alone does not
  // prove they agree — the input adapter could drift. Run both real resolution
  // paths and assert the estimate is identical, so a divergence (a dropped CP
  // tree, a changed source label) fails here instead of silently on one page.
  it("build page and planner agree on DPS for every forked build", () => {
    const tables = makeEntityTables({ sets: db.sets, skills: db.skills, cpStars: db.cpStars });
    for (const build of builds) {
      const buildStats = computeStats(build.gear, db.setById, [
        db.mundusById.get(build.mundusId)?.stats ?? [],
        db.foodById.get(build.foodId)?.stats ?? [],
      ]);
      const buildCp = [...build.cp.warfare, ...build.cp.fitness, ...build.cp.craft]
        .map((id) => db.cpStarById.get(id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      const buildPageDps = estimateLoadoutDps(buildStats, buildCp);

      const state = stateFromBuild(build.slug);
      expect(state, `${build.slug} should fork into planner state`).not.toBeNull();
      const plannerStats = computeStats(state!.gear, tables.setById, [
        mundusStones.find((m) => m.id === state!.mundusId)?.stats ?? [],
        foods.find((f) => f.id === state!.foodId)?.stats ?? [],
      ]);
      const plannerCp = [...state!.cp.warfare, ...state!.cp.fitness, ...state!.cp.craft]
        .map((id) => tables.cpStarById.get(id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      const plannerDps = estimateLoadoutDps(plannerStats, plannerCp);

      expect(plannerDps.dps, `${build.slug} planner vs build-page DPS`).toBe(buildPageDps.dps);
    }
  });
});

describe("build filter coverage", () => {
  it("the /builds filter lists every role and content type present in the catalog", () => {
    for (const role of new Set(builds.map((b) => b.role))) {
      expect(ROLES, `role "${role}" is unfilterable on /builds`).toContain(role);
    }
    for (const content of new Set(builds.map((b) => b.contentType))) {
      expect(CONTENT, `content type "${content}" is unfilterable on /builds`).toContain(content);
    }
  });
});
