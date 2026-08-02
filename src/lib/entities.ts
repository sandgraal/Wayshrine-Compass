import type { Build, BuildEntityRef } from "@/lib/types";

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
