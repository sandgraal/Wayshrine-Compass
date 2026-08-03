/**
 * Presentation-only art for What Next recommendation cards, keyed by the
 * engine's NextAction ids. The deterministic engine knows nothing about this
 * map (CLAUDE.md invariant: its output shape never changes for presentation).
 *
 * Files live in `public/whatnext/` as 512px-square WebPs. Cards render
 * identically without art: a map miss or an absent id in SHIPPED_IDS both
 * produce no thumbnail, avoiding a mount-then-fail layout shift.
 *
 * `unlock-companion-<id>` actions share one generic companion illustration.
 *
 * Workflow: add the action id to SHIPPED_IDS once its WebP lands in
 * public/whatnext/. ACTION_ART holds the expected filenames as a reference
 * even before they ship.
 */

const COMPANION_ART = "/whatnext/unlock-companion.webp";

/** Expected filenames — add entries here when planning art; see SHIPPED_IDS. */
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

/**
 * Action ids whose WebP file is present in public/whatnext/.
 * Use "unlock-companion" to activate the shared companion illustration.
 * Add an id here as soon as its file lands; actionArt() returns undefined for
 * any id absent from this set so no request is fired before the file ships.
 */
const SHIPPED_IDS = new Set<string>([
  // e.g. "set-mundus",
]);

export function actionArt(actionId: string): string | undefined {
  if (actionId.startsWith("unlock-companion-")) {
    return SHIPPED_IDS.has("unlock-companion") ? COMPANION_ART : undefined;
  }
  if (!SHIPPED_IDS.has(actionId)) return undefined;
  return ACTION_ART[actionId];
}
