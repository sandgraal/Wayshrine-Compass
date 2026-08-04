/**
 * Presentation-only art for What Next recommendation cards, keyed by the
 * engine's NextAction ids. The deterministic engine knows nothing about this
 * map (CLAUDE.md invariant: its output shape never changes for presentation).
 *
 * Files live in `public/whatnext/` as 512px-square WebPs, one per entry plus
 * the shared companion illustration. Every entry has its file on disk (the
 * acceptance test asserts it), so a map hit is always renderable; a map miss
 * produces no thumbnail and the card renders identically without art.
 *
 * `unlock-companion-<id>` actions share one generic companion illustration.
 */

const COMPANION_ART = "/whatnext/unlock-companion.webp";

export const ACTION_ART: Partial<Record<string, string>> = {
  "set-mundus": "/whatnext/set-mundus.webp",
  "mount-training": "/whatnext/mount-training.webp",
  "zone-story": "/whatnext/zone-story.webp",
  "collect-skyshards": "/whatnext/collect-skyshards.webp",
  "unlock-wayshrines": "/whatnext/unlock-wayshrines.webp",
  "daily-random-normal": "/whatnext/daily-random-normal.webp",
  "training-gear": "/whatnext/training-gear.webp",
  "join-guilds": "/whatnext/join-guilds.webp",
  "craft-certification": "/whatnext/craft-certification.webp",
  "price-tracking": "/whatnext/price-tracking.webp",
  "overland-zone": "/whatnext/overland-zone.webp",
  "dungeon-normal-rotation": "/whatnext/dungeon-normal-rotation.webp",
  "vet-dungeon-progression": "/whatnext/vet-dungeon-progression.webp",
  "first-normal-trial": "/whatnext/first-normal-trial.webp",
  "level-first-trials": "/whatnext/level-first-trials.webp",
  "pvp-intro": "/whatnext/pvp-intro.webp",
  "unlock-scribing": "/whatnext/unlock-scribing.webp",
  "unlock-subclassing": "/whatnext/unlock-subclassing.webp",
  "slot-cp": "/whatnext/slot-cp.webp",
};

export function actionArt(actionId: string): string | undefined {
  if (actionId.startsWith("unlock-companion-")) return COMPANION_ART;
  return ACTION_ART[actionId];
}
