import type { ChangeNote, PatchCode } from "@/lib/types";

/** Entity ids a draft currently references, per tracked type. Duplicates are fine. */
export interface PlannerDraftRefs {
  setIds: string[];
  skillIds: string[];
  cpStarIds: string[];
}

/** The provenance slice the preview reads; any richer entity shape satisfies it. */
export interface ProvenanceSlice {
  name: string;
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

export interface LiveEntities {
  setById: ReadonlyMap<string, ProvenanceSlice>;
  skillById: ReadonlyMap<string, ProvenanceSlice>;
  cpStarById: ReadonlyMap<string, ProvenanceSlice>;
}

/**
 * A draft has no review provenance, so the preview can never claim "verified" —
 * that badge is reserved for builds a human reviewed (src/lib/freshness.ts).
 * The preview only reports whether current-patch changes touch the draft.
 */
export type FreshnessPreview =
  | { status: "no_changes"; reasons: [] }
  | { status: "needs_review"; reasons: ChangeNote[] };

/**
 * Live freshness preview for an in-progress planner draft: the same conditions
 * computeFreshness applies to a saved Build, evaluated against the current
 * patch. A referenced entity missing from the live facade is a removed entity
 * (all three types here are tracked), not a silent pass.
 */
export function computeFreshnessPreview(
  refs: PlannerDraftRefs,
  live: LiveEntities,
  currentPatch: PatchCode
): FreshnessPreview {
  const reasons: ChangeNote[] = [];

  const check = (
    entityType: "set" | "skill" | "cp_star",
    ids: string[],
    byId: ReadonlyMap<string, ProvenanceSlice>
  ) => {
    for (const entityId of new Set(ids)) {
      const entity = byId.get(entityId);
      if (!entity) {
        reasons.push({
          entityType,
          entityId,
          entityName: entityId,
          patch: currentPatch,
          summary: `${entityId} no longer exists in the ${currentPatch} game data — this draft references a removed entity.`,
        });
      } else if (
        entity.lastChangedPatch === currentPatch &&
        // Equal stamps mean the entity entered tracking this patch (the
        // baseline catalog import), not that it changed — flagging those
        // would amber every draft that uses live data.
        entity.lastChangedPatch !== entity.firstSeenPatch
      ) {
        reasons.push({
          entityType,
          entityId,
          entityName: entity.name,
          patch: currentPatch,
          summary: `${entity.name} changed in ${currentPatch} — this draft references it.`,
        });
      }
    }
  };

  check("set", refs.setIds, live.setById);
  check("skill", refs.skillIds, live.skillById);
  check("cp_star", refs.cpStarIds, live.cpStarById);

  return reasons.length === 0 ? { status: "no_changes", reasons: [] } : { status: "needs_review", reasons };
}
