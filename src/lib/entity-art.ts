import type { GearSet, GearSlot, SetType } from "@/lib/types";

/**
 * Original category iconography for entity rows — set-type sigils and
 * skill-line emblems, drawn for this site (never game-ripped assets; see
 * src/assets/sigils/README.md for the generation prompts and the policy).
 *
 * Same discipline as the character portraits (CLAUDE.md invariant):
 * decorative only, never a data source, never an input to freshness, and a
 * missing file must never break a page. Entities stay name-first — art is
 * additive, keyed off attributes the row already displays as text.
 *
 * Art attaches to CATEGORIES (8 set types, 49 skill lines), never to the
 * 1,000+ individual entities. Files land in public/sigils/ as 96px-square
 * WebPs; add each path to SHIPPED once its file exists so no request fires
 * before the asset ships (the action-art.ts pattern).
 */

export const SET_TYPE_SIGILS: Record<SetType, string> = {
  arena: "/sigils/set-arena.webp",
  crafted: "/sigils/set-crafted.webp",
  dungeon: "/sigils/set-dungeon.webp",
  monster: "/sigils/set-monster.webp",
  mythic: "/sigils/set-mythic.webp",
  overland: "/sigils/set-overland.webp",
  pvp: "/sigils/set-pvp.webp",
  trial: "/sigils/set-trial.webp",
};

/**
 * Keyed "className/line" for class lines, bare "line" for weapon/guild/world
 * lines (their line ids are globally unique). Every distinct line in the
 * dataset resolves here — the acceptance test enforces it against
 * public/dataset/current.json.
 */
export const LINE_EMBLEMS: Record<string, string> = {
  // Arcanist
  "arcanist/class-mastery": "/sigils/line-arcanist-class-mastery.webp",
  "arcanist/curative-runeforms": "/sigils/line-arcanist-curative-runeforms.webp",
  "arcanist/herald-of-the-tome": "/sigils/line-arcanist-herald-of-the-tome.webp",
  "arcanist/soldier-of-apocrypha": "/sigils/line-arcanist-soldier-of-apocrypha.webp",
  // Dragonknight
  "dragonknight/ardent-flame": "/sigils/line-dragonknight-ardent-flame.webp",
  "dragonknight/class-mastery": "/sigils/line-dragonknight-class-mastery.webp",
  "dragonknight/draconic-power": "/sigils/line-dragonknight-draconic-power.webp",
  "dragonknight/earthen-heart": "/sigils/line-dragonknight-earthen-heart.webp",
  // Necromancer
  "necromancer/bone-tyrant": "/sigils/line-necromancer-bone-tyrant.webp",
  "necromancer/class-mastery": "/sigils/line-necromancer-class-mastery.webp",
  "necromancer/grave-lord": "/sigils/line-necromancer-grave-lord.webp",
  "necromancer/living-death": "/sigils/line-necromancer-living-death.webp",
  // Nightblade
  "nightblade/assassination": "/sigils/line-nightblade-assassination.webp",
  "nightblade/class-mastery": "/sigils/line-nightblade-class-mastery.webp",
  "nightblade/shadow": "/sigils/line-nightblade-shadow.webp",
  "nightblade/siphoning": "/sigils/line-nightblade-siphoning.webp",
  // Sorcerer
  "sorcerer/class-mastery": "/sigils/line-sorcerer-class-mastery.webp",
  "sorcerer/daedric-summoning": "/sigils/line-sorcerer-daedric-summoning.webp",
  "sorcerer/dark-magic": "/sigils/line-sorcerer-dark-magic.webp",
  "sorcerer/storm-calling": "/sigils/line-sorcerer-storm-calling.webp",
  // Templar
  "templar/aedric-spear": "/sigils/line-templar-aedric-spear.webp",
  "templar/class-mastery": "/sigils/line-templar-class-mastery.webp",
  "templar/dawns-wrath": "/sigils/line-templar-dawns-wrath.webp",
  "templar/restoring-light": "/sigils/line-templar-restoring-light.webp",
  // Warden
  "warden/animal-companions": "/sigils/line-warden-animal-companions.webp",
  "warden/class-mastery": "/sigils/line-warden-class-mastery.webp",
  "warden/green-balance": "/sigils/line-warden-green-balance.webp",
  "warden/winters-embrace": "/sigils/line-warden-winters-embrace.webp",
  // Weapon
  bow: "/sigils/line-bow.webp",
  "destruction-staff": "/sigils/line-destruction-staff.webp",
  "dual-wield": "/sigils/line-dual-wield.webp",
  "one-hand-and-shield": "/sigils/line-one-hand-and-shield.webp",
  "restoration-staff": "/sigils/line-restoration-staff.webp",
  "two-handed": "/sigils/line-two-handed.webp",
  // Armor
  "heavy-armor": "/sigils/line-heavy-armor.webp",
  "light-armor": "/sigils/line-light-armor.webp",
  "medium-armor": "/sigils/line-medium-armor.webp",
  // Guild
  "dark-brotherhood": "/sigils/line-dark-brotherhood.webp",
  "fighters-guild": "/sigils/line-fighters-guild.webp",
  "mages-guild": "/sigils/line-mages-guild.webp",
  "psijic-order": "/sigils/line-psijic-order.webp",
  "thieves-guild": "/sigils/line-thieves-guild.webp",
  undaunted: "/sigils/line-undaunted.webp",
  // World
  excavation: "/sigils/line-excavation.webp",
  legerdemain: "/sigils/line-legerdemain.webp",
  scrying: "/sigils/line-scrying.webp",
  "soul-magic": "/sigils/line-soul-magic.webp",
  vampire: "/sigils/line-vampire.webp",
  werewolf: "/sigils/line-werewolf.webp",
};

/**
 * Paths whose WebP exists in public/sigils/. Add entries as the art lands;
 * the acceptance test fails on a path listed here without a file (and on a
 * file on disk that no manifest entry references).
 */
export const SHIPPED_SIGILS = new Set<string>([]);

export function setTypeArt(set: Pick<GearSet, "type">): string | undefined {
  const path = SET_TYPE_SIGILS[set.type];
  return SHIPPED_SIGILS.has(path) ? path : undefined;
}

export function lineEmblemKey(skill: { className: string | null; line: string }): string {
  return skill.className ? `${skill.className}/${skill.line}` : skill.line;
}

export function skillLineArt(skill: { className: string | null; line: string }): string | undefined {
  const path = LINE_EMBLEMS[lineEmblemKey(skill)];
  return path && SHIPPED_SIGILS.has(path) ? path : undefined;
}

/**
 * Armory-glyph per gear slot, for the planner's paper-doll layout and the
 * console transcribe sheet. Same category discipline: 12 slot glyphs, not
 * per-item art. The two ring slots share one glyph; a shipped glyph renders,
 * everything else falls back to a lucide category icon at the call site.
 */
export const GEAR_SLOT_GLYPHS: Record<GearSlot, string> = {
  head: "/sigils/slot-head.webp",
  shoulders: "/sigils/slot-shoulders.webp",
  chest: "/sigils/slot-chest.webp",
  hands: "/sigils/slot-hands.webp",
  waist: "/sigils/slot-waist.webp",
  legs: "/sigils/slot-legs.webp",
  feet: "/sigils/slot-feet.webp",
  necklace: "/sigils/slot-necklace.webp",
  ring1: "/sigils/slot-ring.webp",
  ring2: "/sigils/slot-ring.webp",
  frontBarWeapon: "/sigils/slot-weapon.webp",
  backBarWeapon: "/sigils/slot-weapon.webp",
};

export function gearSlotArt(slot: GearSlot): string | undefined {
  const path = GEAR_SLOT_GLYPHS[slot];
  return SHIPPED_SIGILS.has(path) ? path : undefined;
}
