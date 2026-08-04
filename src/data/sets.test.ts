import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { StatDelta } from "@/lib/types";
import { sets } from "./sets";

/**
 * The seed set catalog is a curated approximation of the live game data:
 * bonus wording is paraphrased and per-piece numbers/ordering intentionally
 * drift from the datamined artifact (ingestion reconciles them in production —
 * see the note in sets.ts). So we do NOT assert the seed matches the artifact
 * bonus-for-bonus. What we CAN guard, robustly, is:
 *   1. every seed set is a real set id in the artifact;
 *   2. the bonus tier structure (which piece counts carry a bonus) matches;
 *   3. each declared stat delta is reflected in its own effect wording
 *      (internal consistency — catches a stat attached to the wrong text).
 * All three held across the whole catalog when written, so a future edit that
 * breaks one is an authoring mistake, not an approximation.
 */
type ArtifactSet = { id: string; bonuses: { pieces: number }[] };
const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/dataset/current.json"), "utf8")
) as { sets: ArtifactSet[] };
const artifactSetById = new Map(dataset.sets.map((s) => [s.id, s]));

const pieceStructure = (bonuses: { pieces: number }[]) =>
  [...new Set(bonuses.map((b) => b.pieces))].sort((a, b) => a - b);

/** A flat StatDelta stat must be named in the bonus text that declares it. */
const STAT_KEYWORD: Record<StatDelta["stat"], RegExp> = {
  weaponSpellDamage: /Weapon and Spell Damage/i,
  criticalChance: /Critical Chance/i,
  criticalDamage: /Critical Damage/i,
  maxMagicka: /(Maximum|Max) Magicka/i,
  maxStamina: /(Maximum|Max) Stamina/i,
  maxHealth: /(Maximum|Max) Health/i,
  penetration: /Penetration/i,
  armor: /(Armor|Resistance)/i,
  healingDone: /Healing Done/i,
  magickaRecovery: /Magicka Recovery/i,
  staminaRecovery: /Stamina Recovery/i,
  healthRecovery: /Health Recovery/i,
};

describe("seed sets vs the live artifact", () => {
  it("references only set ids present in public/dataset/current.json", () => {
    const missing = sets.filter((s) => !artifactSetById.has(s.id)).map((s) => s.id);
    expect(missing, `seed sets not in the dataset:\n${missing.join("\n")}`).toEqual([]);
  });

  it("matches the artifact's bonus tier structure (which piece counts carry a bonus)", () => {
    const mismatches: string[] = [];
    for (const s of sets) {
      const art = artifactSetById.get(s.id);
      if (!art) continue;
      const seed = pieceStructure(s.bonuses);
      const live = pieceStructure(art.bonuses);
      if (JSON.stringify(seed) !== JSON.stringify(live)) {
        mismatches.push(`${s.id}: seed [${seed}] vs artifact [${live}]`);
      }
    }
    expect(mismatches, `bonus tier structure differs from the artifact:\n${mismatches.join("\n")}`).toEqual([]);
  });
});

describe("seed set bonuses are internally consistent", () => {
  it("names every declared stat delta in its own effect text", () => {
    const bad: string[] = [];
    for (const s of sets) {
      for (const b of s.bonuses) {
        for (const stat of b.stats ?? []) {
          const re = STAT_KEYWORD[stat.stat];
          if (re && !re.test(b.effect)) {
            bad.push(`${s.id} @${b.pieces}pc: '${stat.stat}' not reflected in "${b.effect}"`);
          }
        }
      }
    }
    expect(bad, `stat deltas that do not match their effect wording:\n${bad.join("\n")}`).toEqual([]);
  });
});
