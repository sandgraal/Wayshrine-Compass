import type { Build, BuildStatus, ChangeNote, PatchCode } from "@/lib/types";
import { buildEntityRefs } from "@/lib/entities";

export interface ProvenanceIndex {
  /** entityType:entityId → { name, lastChangedPatch } */
  get(entityType: string, entityId: string): { name: string; lastChangedPatch: PatchCode } | undefined;
  /**
   * Whether this index is authoritative for the entity type. For a tracked
   * type, a missing entity means it was removed from the game data — a
   * needs_review condition, not a silent pass.
   */
  tracks(entityType: string): boolean;
}

export interface Freshness {
  status: BuildStatus;
  /** Populated when status is needs_review: the exact entities and changes. */
  reasons: ChangeNote[];
  patchVerified: PatchCode;
  patchesBehind: number;
}

function patchIndex(order: PatchCode[], code: PatchCode): number {
  const i = order.indexOf(code);
  return i === -1 ? 0 : i;
}

/**
 * Computes the trust badge for a build. This is the product's whole trust
 * proposition, so the rules are explicit:
 *
 * - stale (red): patchVerified is 2+ patches behind the current patch.
 * - needs_review (amber): any referenced entity changed after the build was
 *   last verified. Reasons name the exact entity and patch.
 * - verified (green): reviewed since the current patch and nothing it
 *   references has changed since.
 */
export function computeFreshness(
  build: Build,
  provenance: ProvenanceIndex,
  currentPatch: PatchCode,
  patchOrder: PatchCode[]
): Freshness {
  const behind = patchIndex(patchOrder, currentPatch) - patchIndex(patchOrder, build.patchVerified);

  const reasons: ChangeNote[] = [];
  for (const ref of buildEntityRefs(build)) {
    const entity = provenance.get(ref.entityType, ref.entityId);
    if (!entity) {
      if (provenance.tracks(ref.entityType)) {
        reasons.push({
          entityType: ref.entityType,
          entityId: ref.entityId,
          entityName: ref.entityId,
          patch: currentPatch,
          summary: `${ref.entityId} no longer exists in the ${currentPatch} game data — this build references a removed entity.`,
        });
      }
      continue;
    }
    const changedAt = patchIndex(patchOrder, entity.lastChangedPatch);
    if (changedAt > patchIndex(patchOrder, build.patchVerified)) {
      reasons.push({
        entityType: ref.entityType,
        entityId: ref.entityId,
        entityName: entity.name,
        patch: entity.lastChangedPatch,
        summary: `${entity.name} changed in ${entity.lastChangedPatch} — this build references it and may be affected.`,
      });
    }
  }

  let status: BuildStatus;
  if (behind >= 2) status = "stale";
  else if (reasons.length > 0) status = "needs_review";
  else status = "verified";

  return { status, reasons, patchVerified: build.patchVerified, patchesBehind: Math.max(0, behind) };
}
