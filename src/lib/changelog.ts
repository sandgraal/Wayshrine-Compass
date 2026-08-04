import type { ChangeKind, DiffReport, EntityChange, EntityType } from "@/lib/types";

/**
 * Display model for the public run feed on /patch-tracker: pure grouping over
 * persisted ingest reports, unit-testable with synthetic data. The rendering
 * rule that matters is the baseline collapse — a run that adds hundreds of
 * entities is a catalog import, and listing each row as if it were news reads
 * as noise (and did: the first UESP ingest produced a 1,192-item wall).
 */

/** A run whose additions exceed this is presented as a catalog import. */
export const BASELINE_COLLAPSE_THRESHOLD = 100;

/** One ingest_runs row with its persisted report. */
export interface IngestRunReport {
  id: number;
  ranAt: string;
  fromPatch: string | null;
  toPatch: string | null;
  report: DiffReport | null;
  flaggedBuilds: number;
}

export interface ChangeGroup {
  kind: ChangeKind;
  entityType: EntityType;
  items: EntityChange[];
}

export interface ChangelogRun {
  id: number;
  ranAt: string;
  fromPatch: string | null;
  toPatch: string | null;
  /** Total changes in the run's report, before any collapse. */
  totalChanges: number;
  /** When set, `added` groups are omitted and summarized as this count. */
  collapsedAdditions: number | null;
  groups: ChangeGroup[];
  flaggedBuilds: number;
}

const KIND_ORDER: ChangeKind[] = ["changed", "renamed", "removed", "added"];
const TYPE_ORDER: EntityType[] = ["set", "skill", "cp_star", "grimoire", "script", "mastery_line"];

const rank = <T,>(order: T[], v: T): number => {
  const i = order.indexOf(v);
  return i === -1 ? order.length : i;
};

/** Where a change links. Only surfaces with row anchors get one. */
export function changeHref(entityType: EntityType, entityId: string): string | null {
  switch (entityType) {
    case "set":
      return `/sets#${entityId}`;
    case "skill":
      return `/skills#${entityId}`;
    default:
      return null;
  }
}

export function buildChangelog(runs: IngestRunReport[]): ChangelogRun[] {
  return runs.map((run) => {
    const changes = run.report?.changes ?? [];
    const additions = changes.filter((c) => c.kind === "added").length;
    const collapse = additions > BASELINE_COLLAPSE_THRESHOLD;

    const grouped = new Map<string, ChangeGroup>();
    for (const change of changes) {
      if (collapse && change.kind === "added") continue;
      const key = `${change.kind}:${change.entityType}`;
      const group = grouped.get(key) ?? { kind: change.kind, entityType: change.entityType, items: [] };
      group.items.push(change);
      grouped.set(key, group);
    }

    const groups = [...grouped.values()].sort(
      (a, b) =>
        rank(KIND_ORDER, a.kind) - rank(KIND_ORDER, b.kind) ||
        rank(TYPE_ORDER, a.entityType) - rank(TYPE_ORDER, b.entityType)
    );
    for (const g of groups) {
      g.items = [...g.items].sort((a, b) => a.entityName.localeCompare(b.entityName));
    }

    return {
      id: run.id,
      ranAt: run.ranAt,
      fromPatch: run.fromPatch,
      toPatch: run.toPatch,
      totalChanges: changes.length,
      collapsedAdditions: collapse ? additions : null,
      groups,
      flaggedBuilds: run.flaggedBuilds,
    };
  });
}
