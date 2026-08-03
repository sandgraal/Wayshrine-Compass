import type { Build, BuildEntityRef, CpStar, GearSet, PatchCode, Skill } from "@/lib/types";

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

  return [...refs.values()];
}

export interface ChangedReferencedEntity {
  entityType: "set" | "skill" | "cp_star";
  entityId: string;
  name: string;
}

/**
 * Entities that changed in `patch` AND are referenced by at least one build.
 * A changed entity nothing references (e.g. an unused mythic) is patch-tracker
 * material, not build risk — copy describing "referenced" entities must count
 * through this, not the raw changed lists.
 */
export function changedReferencedEntities(
  builds: Build[],
  entities: { sets: GearSet[]; skills: Skill[]; cpStars: CpStar[] },
  patch: PatchCode
): ChangedReferencedEntity[] {
  const referenced = new Set<string>();
  for (const build of builds) {
    for (const ref of buildEntityRefs(build)) referenced.add(`${ref.entityType}:${ref.entityId}`);
  }

  const pick = (
    list: { id: string; name: string; lastChangedPatch: PatchCode }[],
    entityType: ChangedReferencedEntity["entityType"]
  ) =>
    list
      .filter((e) => e.lastChangedPatch === patch && referenced.has(`${entityType}:${e.id}`))
      .map((e) => ({ entityType, entityId: e.id, name: e.name }));

  return [
    ...pick(entities.sets, "set"),
    ...pick(entities.skills, "skill"),
    ...pick(entities.cpStars, "cp_star"),
  ];
}
