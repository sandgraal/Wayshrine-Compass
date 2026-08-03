import { describe, expect, it } from "vitest";
import { builds } from "@/data/builds";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { buildEntityRefs, changedReferencedEntities } from "./entities";

describe("changedReferencedEntities", () => {
  const changed = changedReferencedEntities(builds, { sets, skills, cpStars }, "U50");

  it("excludes entities changed this patch that no build references", () => {
    // Oakensoul Ring is the seed's deliberate unreferenced-change case.
    const oakensoul = sets.find((s) => s.id === "set-oakensoul-ring");
    expect(oakensoul?.lastChangedPatch).toBe("U50");
    expect(changed.some((c) => c.entityId === "set-oakensoul-ring")).toBe(false);
  });

  it("includes entities changed this patch that builds reference", () => {
    // Crystal Shard changed in U50 and sorcerer-dps references it.
    expect(changed.some((c) => c.entityType === "skill" && c.name === "Crystal Shard")).toBe(true);
  });

  it("returns only entities both changed in the patch and referenced by a build", () => {
    const referenced = new Set(
      builds.flatMap((b) => buildEntityRefs(b).map((r) => `${r.entityType}:${r.entityId}`))
    );
    const sourceByKey = new Map(
      [
        ...sets.map((e) => ["set:" + e.id, e] as const),
        ...skills.map((e) => ["skill:" + e.id, e] as const),
        ...cpStars.map((e) => ["cp_star:" + e.id, e] as const),
      ]
    );
    expect(changed.length).toBeGreaterThan(0);
    for (const c of changed) {
      expect(referenced.has(`${c.entityType}:${c.entityId}`)).toBe(true);
      expect(c.removed).toBe(false);
      expect(sourceByKey.get(`${c.entityType}:${c.entityId}`)?.lastChangedPatch).toBe("U50");
    }
  });

  it("counts a referenced tracked entity with no current row as removed", () => {
    // Simulate an ingest that deleted Whorl of the Depths while a build
    // still references it — mirrors the freshness.ts removed-entity rule.
    const removedId = "set-whorl-of-the-depths";
    expect(sets.some((s) => s.id === removedId)).toBe(true);
    const result = changedReferencedEntities(
      builds,
      { sets: sets.filter((s) => s.id !== removedId), skills, cpStars },
      "U50"
    );
    const entry = result.find((c) => c.entityId === removedId);
    expect(entry).toEqual({ entityType: "set", entityId: removedId, name: removedId, removed: true });
  });
});
