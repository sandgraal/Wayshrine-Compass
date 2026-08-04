import type {
  Build,
  ClassMasteryLine,
  Companion,
  CpStar,
  EntitySupersession,
  Food,
  GearSet,
  Grimoire,
  MundusStone,
  Patch,
  ScribingScript,
  Skill,
  StatDelta,
  Zone,
} from "@/lib/types";

/**
 * Row → entity mappers, the inverse of the column mapping in
 * scripts/seed-supabase.ts. Pure so they're unit-testable without a network.
 */

type Row = Record<string, unknown>;

interface JsonEffect {
  text?: string;
  stats?: StatDelta[];
}

export function rowToPatch(r: Row): Patch {
  return {
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    releasedAt: String(r.released_at ?? ""),
    season: (r.season as string | null) ?? null,
  };
}

export function rowToSet(r: Row): GearSet {
  return {
    id: String(r.id),
    name: String(r.name),
    type: r.type as GearSet["type"],
    source: String(r.source),
    dlcRequired: (r.dlc_required as string | null) ?? null,
    bonuses: (r.bonuses as GearSet["bonuses"]) ?? [],
    mythicSlot: (r.mythic_slot as GearSet["mythicSlot"]) ?? undefined,
    gameId: (r.game_id as string | null) ?? undefined,
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToSkill(r: Row): Skill {
  return {
    id: String(r.id),
    className: (r.class as Skill["className"]) ?? null,
    line: String(r.line),
    lineLabel: String(r.line_label),
    name: String(r.name),
    ultimate: Boolean(r.ultimate),
    // Optional in the entity model (seed omits it); only an explicit true matters.
    passive: r.passive === true ? true : undefined,
    description: String(r.description ?? ""),
    morphs: (r.morphs as Skill["morphs"]) ?? [],
    gameId: (r.game_id as string | null) ?? undefined,
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToCpStar(r: Row): CpStar {
  const effect = (r.effect ?? {}) as JsonEffect;
  return {
    id: String(r.id),
    tree: r.tree as CpStar["tree"],
    name: String(r.name),
    effect: effect.text ?? "",
    slottable: Boolean(r.slottable),
    gameId: (r.game_id as string | null) ?? undefined,
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToGrimoire(r: Row): Grimoire {
  return {
    id: String(r.id),
    name: String(r.name),
    line: String(r.line),
    lineLabel: String(r.line_label),
    description: String(r.description ?? ""),
    acquisition: String(r.acquisition ?? ""),
    dlcRequired: (r.dlc_required as string | null) ?? null,
    focusScripts: (r.focus_scripts as string[]) ?? [],
    signatureScripts: (r.signature_scripts as string[]) ?? [],
    affixScripts: (r.affix_scripts as string[]) ?? [],
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToScript(r: Row): ScribingScript {
  return {
    id: String(r.id),
    name: String(r.name),
    slot: r.slot as ScribingScript["slot"],
    description: String(r.description ?? ""),
    acquisition: String(r.acquisition ?? ""),
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToMasteryLine(r: Row): ClassMasteryLine {
  return {
    id: String(r.id),
    name: String(r.name),
    className: r.class as ClassMasteryLine["className"],
    line: String(r.line),
    lineLabel: String(r.line_label),
    graftable: Boolean(r.graftable),
    firstSeenPatch: String(r.first_seen_patch),
    lastChangedPatch: String(r.last_changed_patch),
  };
}

export function rowToCompanion(r: Row): Companion {
  return {
    id: String(r.id),
    name: String(r.name),
    className: String(r.class),
    dlcRequired: (r.dlc_required as string | null) ?? null,
    unlockZone: String(r.unlock_zone),
    unlockNpc: String(r.unlock_npc),
    roleRatings: (r.role_ratings as Companion["roleRatings"]) ?? { dps: 0, tank: 0, healer: 0 },
  };
}

export function rowToZone(r: Row): Zone {
  return {
    id: String(r.id),
    name: String(r.name),
    dlcRequired: (r.dlc_required as string | null) ?? null,
    levelScaled: Boolean(r.level_scaled),
  };
}

export function rowToMundus(r: Row): MundusStone {
  const effect = (r.effect ?? {}) as JsonEffect;
  return {
    id: String(r.id),
    name: String(r.name),
    effect: effect.text ?? "",
    stats: effect.stats,
  };
}

export function rowToFood(r: Row): Food {
  const effect = (r.effect ?? {}) as JsonEffect;
  return {
    id: String(r.id),
    name: String(r.name),
    effect: effect.text ?? "",
    stats: effect.stats,
  };
}

export function rowToBuild(r: Row): Build {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    className: r.class as Build["className"],
    subclassLines: (r.subclass_lines as string[]) ?? [],
    role: r.role as Build["role"],
    contentType: r.content_type as Build["contentType"],
    author: String(r.author),
    status: r.status as Build["status"],
    patchVerified: String(r.patch_verified),
    gear: (r.gear as Build["gear"]) ?? [],
    frontBar: (r.front_bar as Build["frontBar"]) ?? { skills: [], ultimate: "" },
    backBar: (r.back_bar as Build["backBar"]) ?? { skills: [], ultimate: "" },
    cp: (r.cp as Build["cp"]) ?? { warfare: [], fitness: [], craft: [] },
    mundusId: String(r.mundus_id ?? ""),
    foodId: String(r.food_id ?? ""),
    // Column default is [] — normalize to "absent" so seed and DB agree.
    scribedSkills:
      Array.isArray(r.scribed_skills) && r.scribed_skills.length > 0
        ? (r.scribed_skills as Build["scribedSkills"])
        : undefined,
    guidance: (r.guidance as Build["guidance"]) ?? [],
    needsReviewReasons: (r.review_reasons as Build["needsReviewReasons"]) ?? [],
  };
}

export function rowToSupersession(r: Row): EntitySupersession {
  return {
    entityType: r.entity_type as EntitySupersession["entityType"],
    oldId: String(r.old_id),
    oldName: String(r.old_name),
    newId: String(r.new_id),
    newName: String(r.new_name),
    patch: String(r.patch),
  };
}
