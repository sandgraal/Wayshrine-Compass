/**
 * Core entity model. Every game entity carries patch provenance
 * (firstSeenPatch / lastChangedPatch) so the diff engine can prove freshness.
 */

export type PatchCode = string; // e.g. "U50"

export interface Patch {
  id: string;
  code: PatchCode;
  name: string;
  releasedAt: string; // ISO date
  season: string | null;
}

export type ClassName =
  | "dragonknight"
  | "sorcerer"
  | "nightblade"
  | "templar"
  | "warden"
  | "necromancer"
  | "arcanist";

export const ALL_CLASSES: ClassName[] = [
  "dragonknight",
  "sorcerer",
  "nightblade",
  "templar",
  "warden",
  "necromancer",
  "arcanist",
];

export type Role = "dps" | "tank" | "healer";
export type ContentType = "trial" | "dungeon" | "overland" | "pvp" | "leveling";

export type SetType =
  | "crafted"
  | "overland"
  | "dungeon"
  | "trial"
  | "arena"
  | "pvp"
  | "monster"
  | "mythic";

/** Structured stat deltas used by the planner's stat computation. */
export interface StatDelta {
  stat:
    | "maxMagicka"
    | "maxStamina"
    | "maxHealth"
    | "weaponSpellDamage"
    | "criticalChance"
    | "criticalDamage"
    | "penetration"
    | "armor"
    | "healingDone"
    | "magickaRecovery"
    | "staminaRecovery"
    | "healthRecovery";
  amount: number;
}

export interface SetBonus {
  pieces: number; // 1..5
  effect: string; // human-readable
  stats?: StatDelta[]; // structured portion, when the bonus is a flat stat
}

export interface GearSet {
  id: string;
  name: string;
  type: SetType;
  /** Where it drops / how it's obtained, player-facing. */
  source: string;
  /** Zone or DLC gate; null = base game. */
  dlcRequired: string | null;
  bonuses: SetBonus[];
  /** Mythics occupy exactly one slot. */
  mythicSlot?: GearSlot;
  /**
   * Stable upstream identifier (e.g. UESP's numeric id), when the source
   * carries one. Optional — the seed omits it. The diff engine uses it as a
   * definitive rename signal when both sides of a diff carry it.
   */
  gameId?: string;
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

export interface SkillMorph {
  name: string;
  description: string;
}

export interface Skill {
  id: string;
  /** null for weapon/guild/world lines. */
  className: ClassName | null;
  line: string; // e.g. "storm-calling", "destruction-staff"
  lineLabel: string; // e.g. "Storm Calling"
  name: string;
  ultimate: boolean;
  description: string;
  morphs: SkillMorph[];
  /**
   * Stable upstream identifier (e.g. UESP's abilityId). Skill ids derive from
   * name + line, so an in-game rename mints a new id; a preserved gameId lets
   * the diff engine recognize the successor definitively. Optional — the seed
   * omits it. See src/lib/ingest/diff.ts.
   */
  gameId?: string;
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

export type CpTree = "warfare" | "fitness" | "craft";

export interface CpStar {
  id: string;
  tree: CpTree;
  name: string;
  effect: string;
  slottable: boolean;
  /** Stable upstream identifier, when the source carries one. See GearSet.gameId. */
  gameId?: string;
  lastChangedPatch: PatchCode;
}

export interface Companion {
  id: string;
  name: string;
  className: string;
  dlcRequired: string | null;
  unlockZone: string;
  unlockNpc: string;
  /** 1-5 subjective viability per role. */
  roleRatings: { dps: number; tank: number; healer: number };
}

export interface Zone {
  id: string;
  name: string;
  dlcRequired: string | null;
  levelScaled: boolean;
}

export type ScriptSlot = "focus" | "signature" | "affix";

export const SCRIPT_SLOTS: ScriptSlot[] = ["focus", "signature", "affix"];

/** A Scribing script (Focus/Signature/Affix), written into a grimoire's slot. */
export interface ScribingScript {
  id: string;
  name: string;
  slot: ScriptSlot;
  description: string;
  /** Player-facing acquisition note ("where do I get this?"). */
  acquisition: string;
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

/** A Scribing grimoire: the base skill players customize with three scripts. */
export interface Grimoire {
  id: string;
  name: string;
  /** Skill line the grimoire slots under, e.g. "bow", "soul-magic". */
  line: string;
  lineLabel: string;
  description: string;
  acquisition: string;
  /** Scribing ships with the Gold Road chapter; null would mean base game. */
  dlcRequired: string | null;
  /** Compatible script ids per slot — entity refs, never free text. */
  focusScripts: string[];
  signatureScripts: string[];
  affixScripts: string[];
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

/**
 * A class skill line as a Class Mastery (subclassing) unit — what a build's
 * subclassLines entry points at. Ids follow `mastery-<class>-<line>`.
 */
export interface ClassMasteryLine {
  id: string;
  /** Display name, class-qualified — line labels repeat across classes. */
  name: string;
  className: ClassName;
  line: string;
  lineLabel: string;
  /** False for the class's own Class Mastery meta line — it can't be grafted. */
  graftable: boolean;
  firstSeenPatch: PatchCode;
  lastChangedPatch: PatchCode;
}

export interface MundusStone {
  id: string;
  name: string;
  effect: string;
  stats?: StatDelta[];
}

export interface Food {
  id: string;
  name: string;
  effect: string;
  stats?: StatDelta[];
}

/* ------------------------------------------------------------------ */
/* Builds                                                              */
/* ------------------------------------------------------------------ */

export type GearSlot =
  | "head"
  | "shoulders"
  | "chest"
  | "hands"
  | "waist"
  | "legs"
  | "feet"
  | "necklace"
  | "ring1"
  | "ring2"
  | "frontBarWeapon"
  | "backBarWeapon";

export const GEAR_SLOTS: GearSlot[] = [
  "head",
  "shoulders",
  "chest",
  "hands",
  "waist",
  "legs",
  "feet",
  "necklace",
  "ring1",
  "ring2",
  "frontBarWeapon",
  "backBarWeapon",
];

export interface GearAssignment {
  slot: GearSlot;
  setId: string;
  trait: string;
  weight?: "light" | "medium" | "heavy";
  enchant?: string;
}

export interface SkillBar {
  /** 5 skill ids, front-to-back order. */
  skills: string[];
  ultimate: string;
}

export type Platform = "pc" | "console";

/**
 * A block of authored guidance. Blocks flagged `pc` are addon-dependent and
 * are replaced by `consoleAlternative` (or hidden) in console mode.
 */
export interface GuidanceBlock {
  platform: Platform | "all";
  title: string;
  body: string;
  consoleAlternative?: string;
}

export type BuildStatus = "verified" | "needs_review" | "stale";

export type EntityType =
  | "set"
  | "skill"
  | "cp_star"
  | "companion"
  | "mundus"
  | "food"
  | "grimoire"
  | "script"
  | "mastery_line";

export interface BuildEntityRef {
  entityType: EntityType;
  entityId: string;
}

export interface ChangeNote {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  patch: PatchCode;
  summary: string;
}

export interface Build {
  id: string;
  slug: string;
  name: string;
  className: ClassName;
  /** Skill lines in use, e.g. "sorcerer/storm-calling" or "nightblade/assassination" (subclassed). */
  subclassLines: string[];
  role: Role;
  contentType: ContentType;
  author: string;
  status: BuildStatus;
  /** Last patch a human reviewed this build against. */
  patchVerified: PatchCode;
  gear: GearAssignment[];
  frontBar: SkillBar;
  backBar: SkillBar;
  cp: Record<CpTree, string[]>; // slotted star ids per tree
  mundusId: string;
  foodId: string;
  /** Scribed skills slotted by this build: grimoire + chosen scripts, by id. */
  scribedSkills?: { grimoireId: string; scriptIds: string[] }[];
  guidance: GuidanceBlock[];
  /** Populated by the ingestion pipeline when flagged. */
  needsReviewReasons: ChangeNote[];
}

/* ------------------------------------------------------------------ */
/* Ingestion / diffing                                                 */
/* ------------------------------------------------------------------ */

/** A raw per-patch snapshot of entity definitions, before provenance stamping. */
export interface PatchDataset {
  patch: Patch;
  sets: Omit<GearSet, "firstSeenPatch" | "lastChangedPatch">[];
  skills: Omit<Skill, "firstSeenPatch" | "lastChangedPatch">[];
  cpStars: Omit<CpStar, "lastChangedPatch">[];
  grimoires: Omit<Grimoire, "firstSeenPatch" | "lastChangedPatch">[];
  scripts: Omit<ScribingScript, "firstSeenPatch" | "lastChangedPatch">[];
  classMasteryLines: Omit<ClassMasteryLine, "firstSeenPatch" | "lastChangedPatch">[];
}

export type ChangeKind = "added" | "changed" | "removed" | "renamed";

export interface EntityChange {
  entityType: EntityType;
  /** For a `renamed` change this is the OLD id — the one builds still reference. */
  entityId: string;
  /** For a `renamed` change this is the OLD name. */
  entityName: string;
  kind: ChangeKind;
  changedFields: string[];
  summary: string;
  /** Present only when kind === "renamed": the successor the old id maps to. */
  renamedTo?: { entityId: string; entityName: string };
}

export interface DiffReport {
  fromPatch: PatchCode;
  toPatch: PatchCode;
  changes: EntityChange[];
}

/**
 * A recorded entity rename: the old id X was dropped and superseded by the new
 * id Y in `patch`. Persisted (supabase/migrations/0004) and folded into the
 * provenance index so freshness can name the successor of a removed reference
 * — builds are never silently rewritten to the new id (that stays an authoring
 * decision; builds reference entities only by id).
 */
export interface EntitySupersession {
  entityType: EntityType;
  oldId: string;
  oldName: string;
  newId: string;
  newName: string;
  patch: PatchCode;
}

export interface AffectedBuild {
  buildId: string;
  changes: EntityChange[];
}

/* ------------------------------------------------------------------ */
/* Player profile / What Next                                          */
/* ------------------------------------------------------------------ */

export type PlayerPlatform = "pc" | "xbox" | "playstation";
export type PlayerGoal =
  | "leveling"
  | "gold"
  | "solo-overland"
  | "dungeons"
  | "trials"
  | "pvp";

export interface PlayerProfile {
  platform: PlayerPlatform;
  className: ClassName;
  level: number; // 1..50
  cp: number; // 0..3600
  esoPlus: boolean;
  dlcOwned: string[]; // dlc ids; ignored when esoPlus (Plus grants access to all DLC, not chapters — modeled as all here)
  companionsOwned: string[]; // companion ids
  goal: PlayerGoal;
  hoursPerWeek: number;
}

export interface NextAction {
  id: string;
  title: string;
  why: string;
  payoff: string;
  timeCost: string;
  /** Higher = earlier in the list. Deterministic. */
  score: number;
  /** True when this advice depends on addons (must never surface on console). */
  addonDependent?: boolean;
}
