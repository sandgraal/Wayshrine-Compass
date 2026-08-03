import { describe, expect, it } from "vitest";
import type { CpStar, GearSet, Skill } from "@/lib/types";
import { computeFreshnessPreview, type LiveEntities, type PlannerDraftRefs } from "./freshness-preview";

const CURRENT = "U50";

const gearSet = (id: string, name: string, lastChangedPatch: string) => ({ id, name, lastChangedPatch }) as GearSet;
const skill = (id: string, name: string, lastChangedPatch: string) => ({ id, name, lastChangedPatch }) as Skill;
const cpStar = (id: string, name: string, lastChangedPatch: string) => ({ id, name, lastChangedPatch }) as CpStar;

const live: LiveEntities = {
  setById: new Map([
    ["set-stable", gearSet("set-stable", "Order's Wrath", "U46")],
    ["set-nerfed", gearSet("set-nerfed", "Deadly Strike", CURRENT)],
  ]),
  skillById: new Map([
    ["skill-stable", skill("skill-stable", "Cephaliarch's Flail", "U44")],
    ["skill-buffed", skill("skill-buffed", "Crystal Shard", CURRENT)],
  ]),
  cpStarById: new Map([
    ["cp-stable", cpStar("cp-stable", "Fighting Finesse", "U40")],
    ["cp-changed", cpStar("cp-changed", "Deadly Aim", CURRENT)],
  ]),
};

const refs = (partial: Partial<PlannerDraftRefs>): PlannerDraftRefs => ({
  setIds: [],
  skillIds: [],
  cpStarIds: [],
  ...partial,
});

describe("planner freshness preview", () => {
  it("reports no_changes — never verified — when nothing slotted moved this patch", () => {
    const preview = computeFreshnessPreview(
      refs({ setIds: ["set-stable"], skillIds: ["skill-stable"], cpStarIds: ["cp-stable"] }),
      live,
      CURRENT
    );
    expect(preview).toEqual({ status: "no_changes", reasons: [] });
  });

  it("flags a slotted set that changed in the current patch, naming entity and patch", () => {
    const preview = computeFreshnessPreview(refs({ setIds: ["set-stable", "set-nerfed"] }), live, CURRENT);
    expect(preview.status).toBe("needs_review");
    expect(preview.reasons).toEqual([
      expect.objectContaining({
        entityType: "set",
        entityId: "set-nerfed",
        entityName: "Deadly Strike",
        patch: CURRENT,
        summary: expect.stringContaining(`Deadly Strike changed in ${CURRENT}`),
      }),
    ]);
  });

  it("treats a set or skill missing from the live facade as removed, not a silent pass", () => {
    const preview = computeFreshnessPreview(
      refs({ setIds: ["set-deleted"], skillIds: ["skill-deleted"] }),
      live,
      CURRENT
    );
    expect(preview.status).toBe("needs_review");
    expect(preview.reasons.map((r) => [r.entityType, r.entityId])).toEqual([
      ["set", "set-deleted"],
      ["skill", "skill-deleted"],
    ]);
    for (const r of preview.reasons) {
      expect(r.summary).toContain(`no longer exists in the ${CURRENT} game data`);
    }
  });

  it("includes CP star references: a star changed this patch flags the draft", () => {
    const preview = computeFreshnessPreview(refs({ cpStarIds: ["cp-stable", "cp-changed"] }), live, CURRENT);
    expect(preview.status).toBe("needs_review");
    expect(preview.reasons).toEqual([
      expect.objectContaining({ entityType: "cp_star", entityId: "cp-changed", entityName: "Deadly Aim" }),
    ]);
  });

  it("treats a removed CP star like removed sets/skills", () => {
    const preview = computeFreshnessPreview(refs({ cpStarIds: ["cp-deleted"] }), live, CURRENT);
    expect(preview.status).toBe("needs_review");
    expect(preview.reasons[0]).toMatchObject({ entityType: "cp_star", entityId: "cp-deleted" });
  });

  it("dedupes repeated references so one entity yields one reason", () => {
    const preview = computeFreshnessPreview(
      refs({
        setIds: ["set-nerfed", "set-nerfed", "set-nerfed", "set-nerfed", "set-nerfed"],
        cpStarIds: ["cp-changed", "cp-changed"],
      }),
      live,
      CURRENT
    );
    expect(preview.reasons).toHaveLength(2);
  });

  it("ignores entities last changed in an earlier patch", () => {
    const preview = computeFreshnessPreview(refs({ setIds: ["set-stable"] }), live, CURRENT);
    expect(preview.status).toBe("no_changes");
  });
});
