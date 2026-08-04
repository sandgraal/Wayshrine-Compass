import type { Build, BuildStatus, ChangeNote, PatchCode } from "@/lib/types";
import { buildEntityRefs } from "@/lib/entities";

export interface SupersessionInfo {
  oldName: string;
  newId: string;
  newName: string;
  patch: PatchCode;
}

export interface ProvenanceIndex {
  /** entityType:entityId → { name, firstSeenPatch, lastChangedPatch } */
  get(
    entityType: string,
    entityId: string
  ): { name: string; firstSeenPatch?: PatchCode; lastChangedPatch: PatchCode } | undefined;
  /**
   * Whether this index is authoritative for the entity type. For a tracked
   * type, a missing entity means it was removed from the game data — a
   * needs_review condition, not a silent pass.
   */
  tracks(entityType: string): boolean;
  /**
   * If a (now-missing) entity was renamed rather than cut, names the successor
   * so the reason can say "X was renamed to Y" instead of a bare "removed".
   * Optional — an index without rename data simply omits it.
   */
  supersededBy?(entityType: string, entityId: string): SupersessionInfo | undefined;
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
 * The patch of the first full-catalog ingest (the U50 UESP import). That run
 * stamped every datamined entity's provenance at once, so
 * firstSeen === lastChanged === U50 means "entered tracking at the baseline",
 * not "changed in U50". Distinguishing the two is the difference between a
 * badge that reports evidence and freshness theater: an amber pill on all 641
 * sets says nothing. This is a code constant, not a stored flag — freshness
 * stays computed from provenance alone.
 */
export const TRACKING_BASELINE_PATCH: PatchCode = "U50";

export type EntityChangeStatus =
  /** In the catalog since the baseline import (or seed era) with no observed change. */
  | { kind: "tracked"; patch: PatchCode }
  /** Added to the game data after the baseline import. */
  | { kind: "added"; patch: PatchCode }
  /** An observed diff: the entity's content actually changed in `patch`. */
  | { kind: "changed"; patch: PatchCode };

/**
 * Classifies an entity's provenance for display. `lastChanged` AFTER
 * `firstSeen` in patch order is the only provable change; equal stamps mean
 * the entity has simply been in the catalog since it was first seen, and
 * out-of-order stamps (corrupt provenance) are treated as tracked rather
 * than claiming a change that cannot have been observed.
 */
export function entityChangeStatus(
  entity: { firstSeenPatch: PatchCode; lastChangedPatch: PatchCode },
  patchOrder: PatchCode[]
): EntityChangeStatus {
  const firstIdx = patchOrder.indexOf(entity.firstSeenPatch);
  const changedIdx = patchOrder.indexOf(entity.lastChangedPatch);
  const patchNumber = (code: PatchCode) => {
    const match = /^U(\d+)$/.exec(code);
    return match ? Number(match[1]) : undefined;
  };
  const firstNumber = patchNumber(entity.firstSeenPatch);
  const changedNumber = patchNumber(entity.lastChangedPatch);
  const isChanged =
    firstIdx !== -1 && changedIdx !== -1
      ? changedIdx > firstIdx
      : firstNumber !== undefined && changedNumber !== undefined
        ? changedNumber > firstNumber
        : false;
  if (isChanged) return { kind: "changed", patch: entity.lastChangedPatch };
  const baseline = patchIndex(patchOrder, TRACKING_BASELINE_PATCH);
  if (patchIndex(patchOrder, entity.firstSeenPatch) > baseline) {
    return { kind: "added", patch: entity.firstSeenPatch };
  }
  return { kind: "tracked", patch: entity.firstSeenPatch };
}

/**
 * The reason shown for a build referencing an entity that was renamed away.
 * Shared by read-time freshness and the ingest pipeline so both phrase it
 * identically. When the successor kept its display name (an id/line move, e.g.
 * Veiled Strike moving skill lines) "renamed to Veiled Strike" would read
 * wrong, so it names the new id instead.
 */
export function renameReason(
  oldName: string,
  newName: string,
  newId: string,
  patch: PatchCode
): string {
  const successor = newName === oldName ? `now id ${newId}` : `now "${newName}"`;
  return `${oldName} was renamed/reworked in ${patch} (${successor}) — this build references the old id and may be affected.`;
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
        const superseded = provenance.supersededBy?.(ref.entityType, ref.entityId);
        if (superseded) {
          // Renamed, not cut: name the successor so an author knows what to
          // re-point to. The build still goes amber — we never rewrite its
          // reference; that's a human authoring decision.
          reasons.push({
            entityType: ref.entityType,
            entityId: ref.entityId,
            entityName: superseded.oldName,
            patch: superseded.patch,
            summary: renameReason(
              superseded.oldName,
              superseded.newName,
              superseded.newId,
              superseded.patch
            ),
          });
        } else {
          reasons.push({
            entityType: ref.entityType,
            entityId: ref.entityId,
            entityName: ref.entityId,
            patch: currentPatch,
            summary: `${ref.entityId} no longer exists in the ${currentPatch} game data — this build references a removed entity.`,
          });
        }
      }
      continue;
    }
    const changedAt = patchIndex(patchOrder, entity.lastChangedPatch);
    if (changedAt > patchIndex(patchOrder, build.patchVerified)) {
      // An entity whose stamps are equal didn't change — it entered tracking
      // (baseline import or a later addition). The build still needs review
      // (its reference postdates its verification), but claiming a change
      // that never happened is exactly the freshness theater players
      // distrust, so the reason says what actually occurred.
      const enteredTracking =
        entity.firstSeenPatch !== undefined && entity.firstSeenPatch === entity.lastChangedPatch;
      const summary = !enteredTracking
        ? `${entity.name} changed in ${entity.lastChangedPatch} — this build references it and may be affected.`
        : entity.lastChangedPatch === TRACKING_BASELINE_PATCH
          ? `${entity.name} entered tracking with the ${entity.lastChangedPatch} catalog import and has not been re-verified for this build since.`
          : `${entity.name} was added in ${entity.lastChangedPatch} and has not been reviewed for this build yet.`;
      reasons.push({
        entityType: ref.entityType,
        entityId: ref.entityId,
        entityName: entity.name,
        patch: entity.lastChangedPatch,
        summary,
      });
    }
  }

  let status: BuildStatus;
  if (behind >= 2) status = "stale";
  else if (reasons.length > 0) status = "needs_review";
  else status = "verified";

  return { status, reasons, patchVerified: build.patchVerified, patchesBehind: Math.max(0, behind) };
}
