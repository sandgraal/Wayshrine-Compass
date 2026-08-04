import type { PatchDataset } from "@/lib/types";

/**
 * Validates an untrusted JSON payload into a PatchDataset. Every field the
 * database schema constrains is checked here, so a malformed dataset is
 * rejected up front instead of failing mid-persistence. Returns null when
 * anything is invalid.
 */

const SET_TYPES = new Set(["crafted", "overland", "dungeon", "trial", "arena", "pvp", "monster", "mythic"]);
const CP_TREES = new Set(["warfare", "fitness", "craft"]);
const SCRIPT_SLOTS = new Set(["focus", "signature", "affix"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isOptionalNullStr = (v: unknown) => v === null || v === undefined || typeof v === "string";
// Optional stable upstream id: absent, or a non-empty string / number. UESP's
// abilityId arrives as a number; normalizeGameId coerces it to a string.
const isOptionalGameId = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.length > 0) || typeof v === "number";

/** Coerces each entity's optional gameId to a string; leaves the rest intact. */
function normalizeGameId<T extends { gameId?: unknown }>(rows: T[]): T[] {
  return rows.map((r) =>
    r.gameId === undefined || r.gameId === null ? r : { ...r, gameId: String(r.gameId) }
  );
}

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
    isOptionalGameId(s.gameId) &&
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
    (s.passive === undefined || typeof s.passive === "boolean") &&
    typeof s.description === "string" &&
    (s.className === null || isStr(s.className)) &&
    isOptionalGameId(s.gameId) &&
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
    typeof s.slottable === "boolean" &&
    isOptionalGameId(s.gameId)
  );
}

const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function isGrimoireDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const g = v as Record<string, unknown>;
  return (
    isStr(g.id) &&
    isStr(g.name) &&
    isStr(g.line) &&
    isStr(g.lineLabel) &&
    typeof g.description === "string" &&
    typeof g.acquisition === "string" &&
    isOptionalNullStr(g.dlcRequired) &&
    isStrArray(g.focusScripts) &&
    isStrArray(g.signatureScripts) &&
    isStrArray(g.affixScripts)
  );
}

function isScriptDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    isStr(s.id) &&
    isStr(s.name) &&
    isStr(s.slot) &&
    SCRIPT_SLOTS.has(s.slot as string) &&
    typeof s.description === "string" &&
    typeof s.acquisition === "string"
  );
}

function isMasteryLineDef(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    isStr(m.id) &&
    isStr(m.name) &&
    isStr(m.className) &&
    isStr(m.line) &&
    isStr(m.lineLabel) &&
    typeof m.graftable === "boolean"
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
  // Scribing + Class Mastery collections are required: the dataset artifact
  // and this parser ship together, and a payload missing them is more likely
  // a truncated/legacy export than a deliberate empty state.
  if (
    !Array.isArray(o.grimoires) ||
    !Array.isArray(o.scripts) ||
    !Array.isArray(o.classMasteryLines) ||
    o.grimoires.length === 0 ||
    o.scripts.length === 0 ||
    o.classMasteryLines.length === 0
  ) {
    return null;
  }
  if (
    !o.grimoires.every(isGrimoireDef) ||
    !o.scripts.every(isScriptDef) ||
    !o.classMasteryLines.every(isMasteryLineDef)
  ) {
    return null;
  }

  return {
    patch: {
      id: typeof patch.id === "string" && patch.id.length > 0 ? patch.id : `patch-${patch.code.toLowerCase()}`,
      code: patch.code,
      name: isStr(patch.name) ? patch.name : patch.code,
      releasedAt: patch.releasedAt,
      season: typeof patch.season === "string" ? patch.season : null,
    },
    sets: normalizeGameId(o.sets as Array<{ gameId?: unknown }>) as PatchDataset["sets"],
    skills: normalizeGameId(o.skills as Array<{ gameId?: unknown }>) as PatchDataset["skills"],
    cpStars: normalizeGameId(o.cpStars as Array<{ gameId?: unknown }>) as PatchDataset["cpStars"],
    grimoires: o.grimoires as PatchDataset["grimoires"],
    scripts: o.scripts as PatchDataset["scripts"],
    classMasteryLines: o.classMasteryLines as PatchDataset["classMasteryLines"],
  };
}
