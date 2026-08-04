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
const IGNORED_FIELDS = new Set(["firstSeenPatch", "lastChangedPatch", "gameId"]);

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

/* ------------------------------------------------------------------ */
/* Rename detection                                                    */
/*                                                                     */
/* A skill/CP-star id derives from its name, so an in-game rename mints */
/* a new id and looks like a removal + an addition. Emitting that pair  */
/* as a single "renamed" change lets freshness give a precise reason    */
/* ("Blastbones was renamed to Sacrificial Bones") instead of a bare    */
/* "removed", while builds still go amber on the old id — we never      */
/* silently rewrite a build's reference (that's an authoring decision). */
/*                                                                     */
/* The matcher is deliberately conservative: a false rename would put   */
/* a wrong successor name in front of users. It requires structural      */
/* evidence (a shared upstream id, or overlapping morph/name tokens),    */
/* and only pairs a removal with an addition when each is the other's    */
/* best match above threshold.                                          */
/* ------------------------------------------------------------------ */

/** Above this combined score a removal↔addition pair is called a rename. */
const RENAME_MIN_SCORE = 0.3;

const RENAME_STOPWORDS = new Set([
  "the", "and", "you", "your", "for", "with", "that", "this", "are", "from",
  "have", "dealing", "damage", "deal", "enemy", "enemies", "seconds", "second",
  "increases", "increase", "increasing", "when", "upon", "gain", "target",
  "area", "nearby", "all", "over", "time", "after", "cast", "your",
]);

function renameTokens(s: string): string[] {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !RENAME_STOPWORDS.has(w));
}

function tokenSet(s: string): Set<string> {
  return new Set(renameTokens(s));
}

/** Jaccard similarity of two token sets. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Overlap coefficient: intersection over the smaller set. */
function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.min(a.size, b.size);
}

interface RenameProfile {
  name: Set<string>;
  body: Set<string>;
  morphs: Set<string>;
  /** class / type / tree — a rename never crosses it. */
  gate: string;
  gameId?: string;
}

function renameProfile(entityType: EntityType, e: AnyEntity): RenameProfile {
  const gameId = typeof e.gameId === "string" && e.gameId ? e.gameId : undefined;
  const morphNames = Array.isArray(e.morphs)
    ? (e.morphs as Array<{ name?: unknown }>).map((m) => String(m?.name ?? ""))
    : [];
  const morphs = new Set<string>();
  for (const m of morphNames) for (const t of renameTokens(m)) morphs.add(t);

  let body = "";
  let gate = "*";
  switch (entityType) {
    case "skill":
      body = String(e.description ?? "");
      gate = `class:${e.className ?? "null"}`;
      break;
    case "set":
      body = Array.isArray(e.bonuses)
        ? (e.bonuses as Array<{ effect?: unknown }>).map((b) => String(b?.effect ?? "")).join(" ")
        : "";
      gate = `type:${String(e.type ?? "")}`;
      break;
    case "cp_star":
      body = String(e.effect ?? "");
      gate = `tree:${String(e.tree ?? "")}`;
      break;
  }
  return { name: tokenSet(e.name), body: tokenSet(body), morphs, gate, gameId };
}

/**
 * How strongly `a` (removed) and `b` (added) look like the same entity under a
 * new name. 1 when a shared upstream id proves it; 0 when the type-specific
 * gate differs or there's no structural (morph/name) overlap at all.
 */
function renameScore(a: RenameProfile, b: RenameProfile): number {
  if (a.gate !== b.gate) return 0;
  // A shared stable id is definitive; differing ids prove they're distinct.
  if (a.gameId && b.gameId) return a.gameId === b.gameId ? 1 : 0;

  const morph = overlap(a.morphs, b.morphs);
  const name = overlap(a.name, b.name);
  // Require structural evidence: description prose alone is too weak to assert
  // a rename (many skills share generic phrasing).
  if (morph === 0 && name === 0) return 0;

  const desc = jaccard(a.body, b.body);
  return 0.5 * morph + 0.3 * name + 0.2 * desc;
}

/**
 * Pairs removed entities with added ones that are the same entity renamed.
 * Mutual-best-match above threshold, so two removals can't both claim one
 * addition and a weak pairing never wins over a strong one.
 */
function detectRenames(
  entityType: EntityType,
  removed: AnyEntity[],
  added: AnyEntity[]
): Array<{ from: AnyEntity; to: AnyEntity }> {
  if (removed.length === 0 || added.length === 0) return [];
  const remP = removed.map((e) => renameProfile(entityType, e));
  const addP = added.map((e) => renameProfile(entityType, e));

  const best = (score: (j: number) => number, n: number) => {
    let bi = -1;
    let bs = 0;
    let tied = false;
    for (let j = 0; j < n; j++) {
      const s = score(j);
      if (s > bs) {
        bs = s;
        bi = j;
        tied = false;
      } else if (s === bs && bs > 0) {
        tied = true;
      }
    }
    return { i: tied ? -1 : bi, s: bs };
  };

  const bestAddFor = remP.map((rp) => best((j) => renameScore(rp, addP[j]), addP.length));
  const bestRemFor = addP.map((ap) => best((i) => renameScore(remP[i], ap), remP.length));

  const pairs: Array<{ from: AnyEntity; to: AnyEntity }> = [];
  for (let i = 0; i < removed.length; i++) {
    const { i: j, s } = bestAddFor[i];
    if (j >= 0 && s >= RENAME_MIN_SCORE && bestRemFor[j].i === i) {
      pairs.push({ from: removed[i], to: added[j] });
    }
  }
  return pairs;
}

function diffCollection(
  entityType: EntityType,
  prev: AnyEntity[],
  next: AnyEntity[]
): EntityChange[] {
  const changes: EntityChange[] = [];
  const prevById = new Map(prev.map((e) => [e.id, e]));
  const nextById = new Map(next.map((e) => [e.id, e]));

  const added: AnyEntity[] = [];
  const removed: AnyEntity[] = [];

  for (const [id, entity] of nextById) {
    const before = prevById.get(id);
    if (!before) {
      added.push(entity);
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
    if (!nextById.has(id)) removed.push(entity);
  }

  const renames = detectRenames(entityType, removed, added);
  const renamedFrom = new Set(renames.map((r) => r.from.id));
  const renamedTo = new Set(renames.map((r) => r.to.id));

  for (const { from, to } of renames) {
    const fields = changedFields(from, to).filter((f) => f !== "id" && f !== "name" && f !== "gameId");
    changes.push({
      entityType,
      entityId: from.id,
      entityName: from.name,
      kind: "renamed",
      changedFields: fields,
      renamedTo: { entityId: to.id, entityName: to.name },
      summary:
        from.name === to.name
          ? `${from.name} moved to a new id ${to.id}.`
          : `${from.name} was renamed to ${to.name}.`,
    });
  }

  for (const entity of added) {
    if (renamedTo.has(entity.id)) continue;
    changes.push({
      entityType,
      entityId: entity.id,
      entityName: entity.name,
      kind: "added",
      changedFields: [],
      summary: `${entity.name} was added.`,
    });
  }

  for (const entity of removed) {
    if (renamedFrom.has(entity.id)) continue;
    changes.push({
      entityType,
      entityId: entity.id,
      entityName: entity.name,
      kind: "removed",
      changedFields: [],
      summary: `${entity.name} was removed.`,
    });
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
      ...diffCollection("grimoire", prev.grimoires as unknown as AnyEntity[], next.grimoires as unknown as AnyEntity[]),
      ...diffCollection("script", prev.scripts as unknown as AnyEntity[], next.scripts as unknown as AnyEntity[]),
      ...diffCollection(
        "mastery_line",
        prev.classMasteryLines as unknown as AnyEntity[],
        next.classMasteryLines as unknown as AnyEntity[]
      ),
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
