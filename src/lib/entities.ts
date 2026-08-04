import type { Build, BuildEntityRef, CpStar, GearSet, PatchCode, Skill } from "@/lib/types";

/** "class/line" (a build's subclassLines entry) → Class Mastery entity id. */
export function masteryLineId(subclassLine: string): string {
  return `mastery-${subclassLine.replace("/", "-")}`;
}

/**
 * Derives the build_entities join rows for a build. Builds never reference
 * game entities as free text — this is the list the diff engine joins against.
 */
export function buildEntityRefs(build: Build): BuildEntityRef[] {
  const refs = new Map<string, BuildEntityRef>();
  const add = (entityType: BuildEntityRef["entityType"], entityId: string) => {
    refs.set(`${entityType}:${entityId}`, { entityType, entityId });
  };

  for (const g of build.gear) add("set", g.setId);
  for (const bar of [build.frontBar, build.backBar]) {
    for (const s of bar.skills) add("skill", s);
    add("skill", bar.ultimate);
  }
  for (const tree of Object.values(build.cp)) {
    for (const star of tree) add("cp_star", star);
  }
  add("mundus", build.mundusId);
  add("food", build.foodId);
  for (const sc of build.scribedSkills ?? []) {
    add("grimoire", sc.grimoireId);
    for (const id of sc.scriptIds) add("script", id);
  }
  // Subclass lines are Class Mastery entities: a grafted (or native) class
  // line that gets reworked or removed must amber the builds standing on it.
  for (const line of build.subclassLines) add("mastery_line", masteryLineId(line));

  return [...refs.values()];
}

export interface ChangedReferencedEntity {
  entityType: "set" | "skill" | "cp_star";
  entityId: string;
  name: string;
  /** True when the entity no longer exists in the current game data. */
  removed: boolean;
}

/**
 * Entities that changed in `patch` AND are referenced by at least one build.
 * A changed entity nothing references (e.g. an unused mythic) is patch-tracker
 * material, not build risk — copy describing "referenced" entities must count
 * through this, not the raw changed lists.
 *
 * A referenced entity of a tracked type with no current row counts too:
 * ingest deletes removed rows, and freshness treats a missing tracked
 * reference as a current-patch change, so omitting removals here would
 * undercount on any removal patch. Removed entities are named by id — there
 * is no current row to take a display name from.
 */
export function changedReferencedEntities(
  builds: Build[],
  entities: { sets: GearSet[]; skills: Skill[]; cpStars: CpStar[] },
  patch: PatchCode
): ChangedReferencedEntity[] {
  const referenced = new Map<string, BuildEntityRef>();
  for (const build of builds) {
    for (const ref of buildEntityRefs(build)) referenced.set(`${ref.entityType}:${ref.entityId}`, ref);
  }

  // Scoped to the original three types on purpose: refs of the newer tracked
  // types (grimoire/script/mastery_line) are skipped here, not counted as
  // removed — the homepage consumes this against exactly these collections.
  const byType: Partial<Record<ChangedReferencedEntity["entityType"], Map<string, { name: string; firstSeenPatch: PatchCode; lastChangedPatch: PatchCode }>>> = {
    set: new Map(entities.sets.map((e) => [e.id, e])),
    skill: new Map(entities.skills.map((e) => [e.id, e])),
    cp_star: new Map(entities.cpStars.map((e) => [e.id, e])),
  };

  const changed: ChangedReferencedEntity[] = [];
  const removed: ChangedReferencedEntity[] = [];
  for (const ref of referenced.values()) {
    const entityType = ref.entityType as ChangedReferencedEntity["entityType"];
    const index = byType[entityType];
    if (!index) continue;
    const entity = index.get(ref.entityId);
    if (!entity) {
      removed.push({ entityType, entityId: ref.entityId, name: ref.entityId, removed: true });
    } else if (entity.lastChangedPatch === patch && entity.lastChangedPatch !== entity.firstSeenPatch) {
      // Equal stamps mean the entity ENTERED tracking at `patch` (the baseline
      // catalog import, or a later addition) — listing it under "changed this
      // patch" would be freshness theater, not evidence.
      changed.push({ entityType, entityId: ref.entityId, name: entity.name, removed: false });
    }
  }

  const order: ChangedReferencedEntity["entityType"][] = ["set", "skill", "cp_star"];
  const sortKey = (e: ChangedReferencedEntity) => `${order.indexOf(e.entityType)}:${e.name}`;
  return [...changed, ...removed].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}
