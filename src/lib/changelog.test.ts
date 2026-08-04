import { describe, expect, it } from "vitest";
import type { EntityChange } from "@/lib/types";
import {
  BASELINE_COLLAPSE_THRESHOLD,
  buildChangelog,
  changeHref,
  type IngestRunReport,
} from "./changelog";

function change(overrides: Partial<EntityChange>): EntityChange {
  return {
    entityType: "set",
    entityId: "set-x",
    entityName: "X",
    kind: "changed",
    changedFields: ["bonuses"],
    summary: "X: bonuses changed.",
    ...overrides,
  };
}

function run(changes: EntityChange[], overrides: Partial<IngestRunReport> = {}): IngestRunReport {
  return {
    id: 1,
    ranAt: "2026-08-04T06:00:00Z",
    fromPatch: "U50",
    toPatch: "U50",
    report: { fromPatch: "U50", toPatch: "U50", changes },
    flaggedBuilds: 0,
    ...overrides,
  };
}

describe("buildChangelog", () => {
  it("groups by kind then entity type, in severity order, items by name", () => {
    const [out] = buildChangelog([
      run([
        change({ kind: "added", entityId: "set-a", entityName: "Alpha" }),
        change({ kind: "changed", entityType: "skill", entityId: "skill-z", entityName: "Zeta" }),
        change({ kind: "changed", entityType: "skill", entityId: "skill-b", entityName: "Beta" }),
        change({ kind: "removed", entityId: "set-r", entityName: "Rho" }),
        change({ kind: "changed", entityId: "set-c", entityName: "Gamma" }),
      ]),
    ]);
    expect(out.groups.map((g) => `${g.kind}:${g.entityType}`)).toEqual([
      "changed:set",
      "changed:skill",
      "removed:set",
      "added:set",
    ]);
    const skillGroup = out.groups.find((g) => g.entityType === "skill")!;
    expect(skillGroup.items.map((i) => i.entityName)).toEqual(["Beta", "Zeta"]);
    expect(out.totalChanges).toBe(5);
    expect(out.collapsedAdditions).toBeNull();
  });

  it("collapses a catalog import's additions to a count, keeping other kinds", () => {
    const additions = Array.from({ length: BASELINE_COLLAPSE_THRESHOLD + 1 }, (_, i) =>
      change({ kind: "added", entityId: `set-${i}`, entityName: `Set ${i}` })
    );
    const [out] = buildChangelog([
      run([...additions, change({ kind: "changed", entityId: "set-real", entityName: "Real" })]),
    ]);
    expect(out.collapsedAdditions).toBe(BASELINE_COLLAPSE_THRESHOLD + 1);
    expect(out.groups.some((g) => g.kind === "added")).toBe(false);
    expect(out.groups.find((g) => g.kind === "changed")?.items).toHaveLength(1);
  });

  it("keeps additions listed when at or under the threshold", () => {
    const additions = Array.from({ length: 3 }, (_, i) =>
      change({ kind: "added", entityId: `set-${i}`, entityName: `Set ${i}` })
    );
    const [out] = buildChangelog([run(additions)]);
    expect(out.collapsedAdditions).toBeNull();
    expect(out.groups.find((g) => g.kind === "added")?.items).toHaveLength(3);
  });

  it("handles runs with empty or missing reports", () => {
    const [empty, missing] = buildChangelog([
      run([]),
      run([], { id: 2, report: null }),
    ]);
    expect(empty.totalChanges).toBe(0);
    expect(empty.groups).toEqual([]);
    expect(missing.totalChanges).toBe(0);
  });

  it("preserves renamedTo and fieldDiffs through grouping", () => {
    const [out] = buildChangelog([
      run([
        change({
          kind: "renamed",
          entityType: "skill",
          entityId: "skill-old",
          entityName: "Old Name",
          renamedTo: { entityId: "skill-new", entityName: "New Name" },
        }),
        change({
          entityId: "set-d",
          entityName: "Delta",
          fieldDiffs: [{ field: "bonuses", before: "a", after: "b" }],
        }),
      ]),
    ]);
    expect(out.groups.find((g) => g.kind === "renamed")?.items[0].renamedTo?.entityName).toBe("New Name");
    expect(out.groups.find((g) => g.kind === "changed")?.items[0].fieldDiffs).toEqual([
      { field: "bonuses", before: "a", after: "b" },
    ]);
  });
});

describe("changeHref", () => {
  it("links sets and skills to their anchored rows, nothing else", () => {
    expect(changeHref("set", "set-x")).toBe("/sets#set-x");
    expect(changeHref("skill", "skill-y")).toBe("/skills#skill-y");
    expect(changeHref("cp_star", "cp-z")).toBeNull();
    expect(changeHref("grimoire", "grimoire-w")).toBeNull();
  });
});
