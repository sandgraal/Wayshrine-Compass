import type {
  AffectedBuild,
  Build,
  DiffReport,
  EntityChange,
  EntityType,
  PatchDataset,
} from "@/lib/types";
import { buildEntityRefs } from "@/lib/entities";

/**
 * The patch-diff engine. Pure functions over two consecutive patch datasets —
 * no I/O — so the acceptance test can drive it with synthetic data.
 */

type AnyEntity = { id: string; name: string } & Record<string, unknown>;

/** Fields that are metadata, not game-mechanical definition. */
const IGNORED_FIELDS = new Set(["firstSeenPatch", "lastChangedPatch"]);

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`).join(",")}}`;
}

function changedFields(prev: AnyEntity, next: AnyEntity): string[] {
  const fields = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const out: string[] = [];
  for (const f of fields) {
    if (IGNORED_FIELDS.has(f)) continue;
    if (stable(prev[f]) !== stable(next[f])) out.push(f);
  }
  return out;
}

function diffCollection(
  entityType: EntityType,
  prev: AnyEntity[],
  next: AnyEntity[]
): EntityChange[] {
  const changes: EntityChange[] = [];
  const prevById = new Map(prev.map((e) => [e.id, e]));
  const nextById = new Map(next.map((e) => [e.id, e]));

  for (const [id, entity] of nextById) {
    const before = prevById.get(id);
    if (!before) {
      changes.push({
        entityType,
        entityId: id,
        entityName: entity.name,
        kind: "added",
        changedFields: [],
        summary: `${entity.name} was added.`,
      });
      continue;
    }
    const fields = changedFields(before, entity);
    if (fields.length > 0) {
      changes.push({
        entityType,
        entityId: id,
        entityName: entity.name,
        kind: "changed",
        changedFields: fields,
        summary: `${entity.name}: ${fields.join(", ")} changed.`,
      });
    }
  }

  for (const [id, entity] of prevById) {
    if (!nextById.has(id)) {
      changes.push({
        entityType,
        entityId: id,
        entityName: entity.name,
        kind: "removed",
        changedFields: [],
        summary: `${entity.name} was removed.`,
      });
    }
  }

  return changes;
}

/** Diff two consecutive patch datasets into a change report. */
export function diffDatasets(prev: PatchDataset, next: PatchDataset): DiffReport {
  return {
    fromPatch: prev.patch.code,
    toPatch: next.patch.code,
    changes: [
      ...diffCollection("set", prev.sets as unknown as AnyEntity[], next.sets as unknown as AnyEntity[]),
      ...diffCollection("skill", prev.skills as unknown as AnyEntity[], next.skills as unknown as AnyEntity[]),
      ...diffCollection("cp_star", prev.cpStars as unknown as AnyEntity[], next.cpStars as unknown as AnyEntity[]),
    ],
  };
}

/**
 * Joins a diff report against build entity refs (the build_entities table)
 * and returns every build that references a changed entity, with the exact
 * changes that affect it.
 */
export function affectedBuilds(report: DiffReport, builds: Build[]): AffectedBuild[] {
  const changeByKey = new Map<string, EntityChange>();
  for (const c of report.changes) changeByKey.set(`${c.entityType}:${c.entityId}`, c);

  const out: AffectedBuild[] = [];
  for (const build of builds) {
    const hits: EntityChange[] = [];
    for (const ref of buildEntityRefs(build)) {
      const change = changeByKey.get(`${ref.entityType}:${ref.entityId}`);
      if (change) hits.push(change);
    }
    if (hits.length > 0) out.push({ buildId: build.id, changes: hits });
  }
  return out;
}
