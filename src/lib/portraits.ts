import type { ClassName } from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";

/**
 * Character portrait catalog.
 *
 * Purely presentational art — portraits carry no game data and never feed the
 * diff engine or freshness computation. Each entry maps to a file in
 * `public/chars/`; a build is assigned one deterministically by class so the
 * same build always renders the same character.
 *
 * The manifest below is the list of files actually present in `public/chars/`.
 * It is explicit rather than globbed so a stray or renamed file can never
 * silently change which portrait a build renders.
 */

export type Gender = "male" | "female";

export const ALL_RACES = [
  "altmer",
  "argonian",
  "bosmer",
  "breton",
  "dunmer",
  "imperial",
  "khajiit",
  "nord",
  "orsimer",
  "redguard",
] as const;

export type Race = (typeof ALL_RACES)[number];

export interface Portrait {
  /** File basename, without extension. Also the portrait's stable id. */
  id: string;
  className: ClassName;
  race: Race;
  gender: Gender;
  /** 1 for the base portrait, 2+ for alternate art of the same character. */
  variant: number;
  src: string;
  alt: string;
}

/** `<race>-<class>-<gender>[-<variant>]`, one per file in `public/chars/`. */
const MANIFEST = `
altmer-arcanist-female
altmer-arcanist-male
altmer-dragonknight-female
altmer-dragonknight-female-2
altmer-dragonknight-male
altmer-dragonknight-male-2
altmer-dragonknight-male-3
altmer-necromancer-female
altmer-necromancer-male
altmer-necromancer-male-2
altmer-nightblade-female
altmer-nightblade-female-2
altmer-nightblade-male
altmer-nightblade-male-2
altmer-sorcerer-female
altmer-sorcerer-male
altmer-templar-female
altmer-templar-male
altmer-warden-female
altmer-warden-male
altmer-warden-male-2
altmer-warden-male-3
argonian-arcanist-female
argonian-arcanist-male
argonian-dragonknight-female
argonian-dragonknight-female-2
argonian-dragonknight-male
argonian-necromancer-female
argonian-necromancer-male
argonian-nightblade-female
argonian-nightblade-male
argonian-sorcerer-female
argonian-sorcerer-female-2
argonian-sorcerer-male
argonian-templar-female
argonian-templar-male
argonian-warden-female
argonian-warden-female-2
argonian-warden-female-3
argonian-warden-male
bosmer-arcanist-female
bosmer-arcanist-male
bosmer-dragonknight-female
bosmer-dragonknight-male
bosmer-necromancer-female
bosmer-necromancer-male
bosmer-nightblade-female
bosmer-nightblade-male
bosmer-nightblade-male-2
bosmer-sorcerer-female
bosmer-sorcerer-female-2
bosmer-sorcerer-male
bosmer-sorcerer-male-2
bosmer-sorcerer-male-3
bosmer-templar-female
bosmer-templar-male
bosmer-warden-female
bosmer-warden-female-2
bosmer-warden-male
breton-arcanist-female
breton-arcanist-male
breton-arcanist-male-2
breton-dragonknight-female
breton-dragonknight-male
breton-necromancer-female
breton-necromancer-male
breton-nightblade-female
breton-nightblade-female-2
breton-nightblade-male
breton-nightblade-male-2
breton-sorcerer-female
breton-sorcerer-female-2
breton-sorcerer-male
breton-templar-female
breton-templar-female-2
breton-templar-female-3
breton-templar-male
breton-templar-male-2
breton-warden-female
breton-warden-female-2
breton-warden-female-3
breton-warden-male
dunmer-arcanist-female
dunmer-arcanist-male
dunmer-dragonknight-female
dunmer-dragonknight-female-2
dunmer-dragonknight-male
dunmer-dragonknight-male-2
dunmer-necromancer-female
dunmer-necromancer-male
dunmer-nightblade-female
dunmer-nightblade-male
dunmer-sorcerer-female
dunmer-sorcerer-male
dunmer-templar-female
dunmer-templar-female-2
dunmer-templar-male
dunmer-warden-female
dunmer-warden-male
dunmer-warden-male-2
imperial-arcanist-female
imperial-arcanist-male
imperial-dragonknight-female
imperial-dragonknight-male
imperial-necromancer-female
imperial-necromancer-male
imperial-nightblade-female
imperial-nightblade-male
imperial-sorcerer-female
imperial-sorcerer-female-2
imperial-sorcerer-female-3
imperial-sorcerer-male
imperial-templar-female
imperial-templar-male
imperial-templar-male-2
imperial-warden-female
imperial-warden-female-2
imperial-warden-male
imperial-warden-male-2
khajiit-arcanist-female
khajiit-arcanist-male
khajiit-dragonknight-female
khajiit-dragonknight-male
khajiit-dragonknight-male-2
khajiit-necromancer-female
khajiit-necromancer-male
khajiit-nightblade-female
khajiit-nightblade-male
khajiit-nightblade-male-2
khajiit-nightblade-male-3
khajiit-sorcerer-female
khajiit-sorcerer-male
khajiit-sorcerer-male-2
khajiit-templar-female
khajiit-templar-male
khajiit-warden-female
khajiit-warden-male
khajiit-warden-male-2
khajiit-warden-male-3
nord-arcanist-female
nord-arcanist-male
nord-dragonknight-female
nord-dragonknight-female-2
nord-dragonknight-male
nord-necromancer-female
nord-necromancer-male
nord-necromancer-male-2
nord-nightblade-female
nord-nightblade-female-2
nord-nightblade-female-3
nord-nightblade-female-4
nord-nightblade-male
nord-sorcerer-female
nord-sorcerer-male
nord-templar-female
nord-templar-female-2
nord-templar-male
nord-warden-female
nord-warden-female-2
nord-warden-male
nord-warden-male-2
orsimer-arcanist-female
orsimer-arcanist-male
orsimer-dragonknight-female
orsimer-dragonknight-male
orsimer-necromancer-female
orsimer-necromancer-female-2
orsimer-necromancer-male
orsimer-nightblade-female
orsimer-nightblade-female-2
orsimer-nightblade-male
orsimer-sorcerer-female
orsimer-sorcerer-female-2
orsimer-sorcerer-female-3
orsimer-sorcerer-male
orsimer-sorcerer-male-2
orsimer-templar-female
orsimer-templar-male
orsimer-templar-male-2
orsimer-templar-male-3
orsimer-warden-female
orsimer-warden-male
redguard-arcanist-female
redguard-arcanist-female-2
redguard-arcanist-female-3
redguard-arcanist-male
redguard-dragonknight-female
redguard-dragonknight-female-2
redguard-dragonknight-male
redguard-necromancer-female
redguard-necromancer-male
redguard-nightblade-female
redguard-nightblade-female-2
redguard-nightblade-female-3
redguard-nightblade-female-4
redguard-nightblade-male
redguard-nightblade-male-2
redguard-nightblade-male-3
redguard-nightblade-male-4
redguard-sorcerer-female
redguard-sorcerer-male
redguard-sorcerer-male-2
redguard-templar-female
redguard-templar-male
redguard-warden-female
redguard-warden-male
redguard-warden-male-2
`;

const RACES = new Set<string>(ALL_RACES);
const CLASSES = new Set<string>(ALL_CLASSES);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parse(id: string): Portrait | null {
  const m = /^([a-z]+)-([a-z]+)-(male|female)(?:-(\d+))?$/.exec(id);
  if (!m) return null;
  const [, race, className, gender, variant] = m;
  // Guard the manifest against a filename that does not name a real race or
  // class — such an entry would otherwise create an unreachable bucket.
  if (!RACES.has(race) || !CLASSES.has(className)) return null;
  return {
    id,
    className: className as ClassName,
    race: race as Race,
    gender: gender as Gender,
    variant: variant ? Number(variant) : 1,
    src: `/chars/${id}.webp`,
    alt: `${capitalize(race)} ${className} character portrait`,
  };
}

/** Every portrait in `public/chars/`, covering all 10 races x 7 classes x 2 genders. */
export const PORTRAITS: Portrait[] = MANIFEST.trim()
  .split("\n")
  .map((line) => parse(line.trim()))
  .filter((p): p is Portrait => p !== null);

const BY_CLASS = PORTRAITS.reduce<Record<string, Portrait[]>>((acc, p) => {
  (acc[p.className] ??= []).push(p);
  return acc;
}, {});

export function portraitsForClass(className: ClassName): Portrait[] {
  return BY_CLASS[className] ?? [];
}

export function portraitById(id: string): Portrait | undefined {
  return PORTRAITS.find((p) => p.id === id);
}

/** Narrow the catalog by any combination of race, class and gender. */
export function portraitsMatching(filter: {
  race?: Race;
  className?: ClassName;
  gender?: Gender;
}): Portrait[] {
  return PORTRAITS.filter(
    (p) =>
      (!filter.race || p.race === filter.race) &&
      (!filter.className || p.className === filter.className) &&
      (!filter.gender || p.gender === filter.gender)
  );
}

/** FNV-1a. Stable across processes and deploys, unlike hashing on object identity. */
function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick a portrait for a build. Deterministic in the build's own id, so a given
 * build keeps its character across renders and deploys while builds of the same
 * class still spread across the available art.
 */
export function portraitForBuild(build: { id: string; className: ClassName }): Portrait | undefined {
  const options = portraitsForClass(build.className);
  if (options.length === 0) return undefined;
  return options[hash(build.id) % options.length];
}
