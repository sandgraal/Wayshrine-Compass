import type { GearSet, Zone } from "@/lib/types";
import { ALL_DLC_IDS } from "@/data/zones";

/**
 * Presentation + query helpers for the zones index. Zones (src/data/zones.ts)
 * store only a `dlcRequired` gate id; this module turns that id into the
 * player-facing name and access tier the page renders, and matches the gate
 * against the tracked set catalog. Pure and data-source agnostic — the page
 * feeds it whatever `db.sets`/`db.zones` the active facade returns.
 */

export type ZoneTier = "Base game" | "Chapter" | "DLC" | "Season";

/** Tiers in the order the index presents them. */
export const ZONE_TIER_ORDER: ZoneTier[] = ["Base game", "Chapter", "DLC", "Season"];

interface DlcMeta {
  name: string;
  tier: Exclude<ZoneTier, "Base game">;
}

/**
 * Player-facing metadata for each gate id a zone can carry. Chapters are the
 * annual paid expansions — unlike DLC game packs they are *not* part of an ESO
 * Plus membership, which is the distinction the access copy leans on. Ids
 * absent here fall back to a title-cased name at the "DLC" tier; a test asserts
 * every gate the seed zones actually use is covered explicitly.
 */
export const DLC_META: Record<string, DlcMeta> = {
  morrowind: { name: "Morrowind", tier: "Chapter" },
  summerset: { name: "Summerset", tier: "Chapter" },
  elsweyr: { name: "Elsweyr", tier: "Chapter" },
  greymoor: { name: "Greymoor", tier: "Chapter" },
  blackwood: { name: "Blackwood", tier: "Chapter" },
  "high-isle": { name: "High Isle", tier: "Chapter" },
  necrom: { name: "Necrom", tier: "Chapter" },
  "gold-road": { name: "Gold Road", tier: "Chapter" },
  firesong: { name: "Firesong", tier: "DLC" },
  "seasons-of-the-worm-cult": { name: "Seasons of the Worm Cult", tier: "Season" },
};

export interface ZoneAccess {
  tier: ZoneTier;
  /** The chapter/DLC/season display name, or null for a base-game zone. */
  packName: string | null;
  /** One-line, original explanation of how a player reaches the zone. */
  note: string;
}

function titleCase(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** How a zone is unlocked, classified from its gate id. */
export function zoneAccess(zone: Zone): ZoneAccess {
  if (!zone.dlcRequired || zone.dlcRequired === "morrowind") {
    return {
      tier: "Base game",
      packName: null,
      note: "Included with the base game — open to every account from level one.",
    };
  }
  const meta = DLC_META[zone.dlcRequired] ?? { name: titleCase(zone.dlcRequired), tier: "DLC" as const };
  switch (meta.tier) {
    case "Chapter":
      return {
        tier: "Chapter",
        packName: meta.name,
        note: `Part of the ${meta.name} Chapter — included while ESO Plus is active, or bought on its own to keep.`,
      };
    case "Season":
      return {
        tier: "Season",
        packName: meta.name,
        note: `Released as ${meta.name}. Play it while your ESO Plus membership is active, or buy it to keep.`,
      };
    default:
      return {
        tier: "DLC",
        packName: meta.name,
        note: `The ${meta.name} DLC. Included while ESO Plus is active, or buy it once with crowns.`,
      };
  }
}

/** The name matched against set `source` text for base-game zones, with any
 *  parenthetical qualifier (e.g. "Cyrodiil (PvP)") stripped. */
function baseZoneToken(zone: Zone): string {
  return zone.name.replace(/\s*\([^)]*\)\s*/g, " ").trim();
}

/**
 * The tracked sets that drop in a zone. Chapter/DLC/season zones match on the
 * precise `dlcRequired` gate; base-game zones (which all share the null gate)
 * match when the zone's name appears in a set's human `source` text.
 * Deliberately conservative — the seed catalog only covers a slice of the
 * world, so a zone with nothing curated returns an empty list rather than
 * guessing.
 */
export function setsForZone(zone: Zone, sets: GearSet[]): GearSet[] {
  if (zone.dlcRequired) {
    return sets.filter((s) => s.dlcRequired === zone.dlcRequired);
  }
  const token = baseZoneToken(zone).toLowerCase();
  return sets.filter((s) => s.dlcRequired === null && s.source.toLowerCase().includes(token));
}

/** Release-order sort key: base game first, then chapters/DLC/seasons in the
 *  order they shipped (per ALL_DLC_IDS). Unknown ids sort last. */
export function releaseIndex(zone: Zone): number {
  if (!zone.dlcRequired) return -1;
  const i = ALL_DLC_IDS.indexOf(zone.dlcRequired);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

export interface ZoneTierGroup {
  tier: ZoneTier;
  zones: Zone[];
}

/**
 * Groups zones by access tier in presentation order, each group sorted by
 * release order. Empty tiers are omitted so the page never renders a bare
 * heading.
 */
export function groupZonesByTier(zones: Zone[]): ZoneTierGroup[] {
  const byTier = new Map<ZoneTier, Zone[]>();
  for (const zone of zones) {
    const { tier } = zoneAccess(zone);
    const list = byTier.get(tier) ?? [];
    list.push(zone);
    byTier.set(tier, list);
  }
  return ZONE_TIER_ORDER.filter((tier) => byTier.has(tier)).map((tier) => ({
    tier,
    zones: [...byTier.get(tier)!].sort((a, b) => releaseIndex(a) - releaseIndex(b)),
  }));
}
