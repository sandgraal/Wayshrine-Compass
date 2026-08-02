import type { PatchDataset } from "@/lib/types";

/**
 * Validates an untrusted JSON payload into a PatchDataset. Returns null when
 * the shape is unusable; entity contents are diffed as opaque definitions, so
 * only the structural envelope is enforced here.
 */
export function parsePatchDataset(json: unknown): PatchDataset | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const patch = o.patch as Record<string, unknown> | undefined;
  if (!patch || typeof patch.code !== "string" || patch.code.length === 0) return null;
  if (!Array.isArray(o.sets) || !Array.isArray(o.skills) || !Array.isArray(o.cpStars)) return null;

  const hasIds = (rows: unknown[]) =>
    rows.every((r) => r !== null && typeof r === "object" && typeof (r as Record<string, unknown>).id === "string");
  if (!hasIds(o.sets) || !hasIds(o.skills) || !hasIds(o.cpStars)) return null;

  return {
    patch: {
      id: typeof patch.id === "string" ? patch.id : `patch-${patch.code.toLowerCase()}`,
      code: patch.code,
      name: typeof patch.name === "string" ? patch.name : patch.code,
      releasedAt: typeof patch.releasedAt === "string" ? patch.releasedAt : "",
      season: typeof patch.season === "string" ? patch.season : null,
    },
    sets: o.sets as PatchDataset["sets"],
    skills: o.skills as PatchDataset["skills"],
    cpStars: o.cpStars as PatchDataset["cpStars"],
  };
}
