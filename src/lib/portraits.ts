import type { ClassName } from "@/lib/types";

/**
 * Character portrait catalog.
 *
 * Purely presentational art — portraits carry no game data and never feed the
 * diff engine or freshness computation. Each entry maps to a file in
 * `public/chars/`; a build is assigned one deterministically by class so the
 * same build always renders the same character.
 */

export type Gender = "male" | "female";

export interface Portrait {
  /** File basename, without extension. Also the portrait's stable id. */
  id: string;
  className: ClassName;
  race: string;
  gender: Gender;
  src: string;
  alt: string;
}

function portrait(id: string, className: ClassName, race: string, gender: Gender): Portrait {
  return {
    id,
    className,
    race,
    gender,
    src: `/chars/${id}.jpeg`,
    alt: `${race} ${className} character portrait`,
  };
}

/**
 * Every portrait in `public/chars/`. All seven classes are covered, so
 * `portraitsForClass` never returns an empty list.
 */
export const PORTRAITS: Portrait[] = [
  portrait("breton-arcanist-male", "arcanist", "Breton", "male"),
  portrait("nord-dragonknight-male", "dragonknight", "Nord", "male"),
  portrait("nord-dragonknight-female", "dragonknight", "Nord", "female"),
  portrait("nord-dragonknight-female-2", "dragonknight", "Nord", "female"),
  portrait("dunmer-necromancer-female", "necromancer", "Dunmer", "female"),
  portrait("bosmer-nightblade-female", "nightblade", "Bosmer", "female"),
  portrait("khajiit-nightblade-male", "nightblade", "Khajiit", "male"),
  portrait("khajiit-nightblade-male-2", "nightblade", "Khajiit", "male"),
  portrait("khajiit-nightblade-male-3", "nightblade", "Khajiit", "male"),
  portrait("altmer-sorcerer-female", "sorcerer", "Altmer", "female"),
  portrait("argonian-templar-female", "templar", "Argonian", "female"),
  portrait("imperial-templar-male", "templar", "Imperial", "male"),
  portrait("orsimer-warden-female", "warden", "Orsimer", "female"),
  portrait("redguard-warden-male", "warden", "Redguard", "male"),
];

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
