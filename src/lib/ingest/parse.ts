import type { PatchDataset } from "@/lib/types";

/**
 * Validates an untrusted JSON payload into a PatchDataset. Every field the
 * database schema constrains is checked here, so a malformed dataset is
 * rejected up front instead of failing mid-persistence. Returns null when
 * anything is invalid.
 */

const SET_TYPES = new Set(["crafted", "overland", "dungeon", "trial", "arena", "pvp", "monster", "mythic"]);
const CP_TREES = new Set(["warfare", "fitness", "craft"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isOptionalNullStr = (v: unknown) => v === null || v === undefined || typeof v === "string";

function isSetDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    isStr(s.id) &&
    isStr(s.name) &&
    isStr(s.type) &&
    SET_TYPES.has(s.type as string) &&
    isStr(s.source) &&
    isOptionalNullStr(s.dlcRequired) &&
    Array.isArray(s.bonuses) &&
    s.bonuses.every(
      (b) =>
        b !== null &&
        typeof b === "object" &&
        typeof (b as Record<string, unknown>).pieces === "number" &&
        isStr((b as Record<string, unknown>).effect)
    )
  );
}

function isSkillDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    isStr(s.id) &&
    isStr(s.name) &&
    isStr(s.line) &&
    isStr(s.lineLabel) &&
    typeof s.ultimate === "boolean" &&
    typeof s.description === "string" &&
    (s.className === null || isStr(s.className)) &&
    Array.isArray(s.morphs) &&
    s.morphs.every(
      (m) =>
        m !== null &&
        typeof m === "object" &&
        isStr((m as Record<string, unknown>).name) &&
        typeof (m as Record<string, unknown>).description === "string"
    )
  );
}

function isCpStarDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    isStr(s.id) &&
    isStr(s.name) &&
    isStr(s.tree) &&
    CP_TREES.has(s.tree as string) &&
    typeof s.effect === "string" &&
    typeof s.slottable === "boolean"
  );
}

export function parsePatchDataset(json: unknown): PatchDataset | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const patch = o.patch as Record<string, unknown> | undefined;
  if (!patch || !isStr(patch.code)) return null;
  // A patch without a valid release date cannot be ordered against existing
  // patches, which would corrupt freshness math — reject it.
  if (!isStr(patch.releasedAt) || !ISO_DATE.test(patch.releasedAt)) return null;
  if (!Array.isArray(o.sets) || !Array.isArray(o.skills) || !Array.isArray(o.cpStars)) return null;
  if (!o.sets.every(isSetDef) || !o.skills.every(isSkillDef) || !o.cpStars.every(isCpStarDef)) return null;

  return {
    patch: {
      id: typeof patch.id === "string" && patch.id.length > 0 ? patch.id : `patch-${patch.code.toLowerCase()}`,
      code: patch.code,
      name: isStr(patch.name) ? patch.name : patch.code,
      releasedAt: patch.releasedAt,
      season: typeof patch.season === "string" ? patch.season : null,
    },
    sets: o.sets as PatchDataset["sets"],
    skills: o.skills as PatchDataset["skills"],
    cpStars: o.cpStars as PatchDataset["cpStars"],
  };
}
