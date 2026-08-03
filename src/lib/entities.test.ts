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
    expect(changed.length).toBeGreaterThan(0);
    for (const c of changed) {
      expect(referenced.has(`${c.entityType}:${c.entityId}`)).toBe(true);
    }
  });
});
