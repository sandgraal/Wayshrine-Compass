/**
 * Scaffolds seed entries (src/data/sets.ts / skills.ts) straight from the live
 * artifact so new entries are correct by construction — the structural mistakes
 * the guards catch (a passive slotted as an active, a wrong bonus tier, a stat
 * delta that doesn't match its wording) can't be introduced in the first place.
 *
 * It fills in the things the artifact knows for sure — id, type, source, DLC,
 * class/line/ultimate, morph names, bonus tiers, and the flat stat deltas parsed
 * from each "Adds N ..." line — and leaves the human prose (original skill
 * descriptions, paraphrased proc effects) as clearly-marked TODOs, printing the
 * artifact text as a `// ref:` line so the author paraphrases it accurately
 * rather than inventing it. Passives are refused outright.
 *
 * Usage:
 *   npx tsx scripts/scaffold-entities.ts set-mothers-sorrow skill-sorcerer-dark-magic-crystal-shard
 *
 * Copy the printed blocks into sets.ts / skills.ts, fill the TODOs, and let
 * `npm test` (the sets/builds guards) confirm the result.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ArtifactBonus {
  pieces: number;
  effect: string;
}
export interface ArtifactSet {
  id: string;
  name: string;
  type: string;
  source: string;
  dlcRequired: string | null;
  bonuses: ArtifactBonus[];
}
export interface ArtifactSkill {
  id: string;
  name: string;
  className: string | null;
  line: string;
  lineLabel: string;
  ultimate: boolean;
  description: string;
  morphs: { name: string; description: string }[];
}

/** Stat name (as the artifact writes it) → seed StatDelta stat + helper form. */
const STAT_MAP: Record<string, { stat: string; helper?: (n: number) => string }> = {
  "Weapon and Spell Damage": { stat: "weaponSpellDamage", helper: (n) => `dmg(${n})` },
  "Critical Chance": { stat: "criticalChance", helper: (n) => `crit(${n})` },
  "Critical Damage": { stat: "criticalDamage" },
  "Maximum Magicka": { stat: "maxMagicka", helper: (n) => `mag(${n})` },
  "Maximum Stamina": { stat: "maxStamina", helper: (n) => `stam(${n})` },
  "Maximum Health": { stat: "maxHealth", helper: (n) => `hp(${n})` },
  "Offensive Penetration": { stat: "penetration", helper: (n) => `pen(${n})` },
  Armor: { stat: "armor", helper: (n) => `armor(${n})` },
  "Healing Done": { stat: "healingDone", helper: (n) => `heal(${n})` },
  "Magicka Recovery": { stat: "magickaRecovery" },
  "Stamina Recovery": { stat: "staminaRecovery" },
  "Health Recovery": { stat: "healthRecovery" },
};

export interface LeadingStat {
  stat: string;
  amount: number;
  statName: string;
  percent: boolean;
  /** True when the whole bonus is just this stat line (safe to auto-fill). */
  pure: boolean;
}

/**
 * Parse a leading "Adds N <Stat>" (or "Adds N% <Stat>") from a bonus effect.
 * Ranges like "3-129" resolve to their max. Returns null when the effect does
 * not start with a stat this seed models (a proc, a Minor/Major buff, etc.).
 */
export function matchLeadingStat(effect: string): LeadingStat | null {
  const trimmed = effect.trim();
  const m = /^Adds\s+([\d,]+(?:-[\d,]+)?)(\s*%)?\s+([A-Za-z][A-Za-z ]+?)\s*(?:\.|,|$)/.exec(trimmed);
  if (!m) return null;
  const statName = m[3].trim();
  const mapped = STAT_MAP[statName];
  if (!mapped) return null;
  const amount = Number(m[1].split("-").pop()!.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  const rest = trimmed.slice(m[0].length).trim();
  return { stat: mapped.stat, amount, statName, percent: Boolean(m[2]), pure: rest === "" };
}

function statDeltaLiteral(ls: LeadingStat): string {
  const mapped = STAT_MAP[ls.statName];
  return mapped.helper ? mapped.helper(ls.amount) : `{ stat: "${ls.stat}", amount: ${ls.amount} }`;
}

function statEffectText(ls: LeadingStat): string {
  return `Adds ${ls.amount}${ls.percent ? "%" : ""} ${ls.statName}`;
}

/** True for a skill that can be slotted on a bar: an ultimate or a morphed active. */
export function isSlottableSkill(skill: Pick<ArtifactSkill, "ultimate" | "morphs">): boolean {
  return skill.ultimate === true || (Array.isArray(skill.morphs) && skill.morphs.length > 0);
}

export function scaffoldSkill(skill: ArtifactSkill, patchCode: string): string {
  if (!isSlottableSkill(skill)) {
    throw new Error(
      `${skill.id} is a passive (no morphs) and cannot be slotted on a bar — pick an active or ultimate.`
    );
  }
  const cls = skill.className === null ? "null" : `"${skill.className}"`;
  const morphs = skill.morphs.map((m) => `"${m.name}"`).join(", ");
  const ult = skill.ultimate ? "ult: true, " : "";
  const patch = `patch: { first: "${patchCode}", last: "${patchCode}" }`;
  const firstSentence = (skill.description || "").split(/(?<=\.)\s/)[0].replace(/"/g, "'");
  return [
    `// ref (paraphrase — do not copy): ${firstSentence}`,
    `sk(${cls}, "${skill.line}", "${skill.lineLabel}", "${skill.name}", { ${ult}desc: "TODO original one-line summary", morphs: [${morphs}], ${patch} }),`,
  ].join("\n");
}

export function scaffoldSet(set: ArtifactSet, patchCode: string): string {
  const lines: string[] = [];
  lines.push(`{`);
  lines.push(`  id: "${set.id}",`);
  lines.push(`  name: "${set.name.replace(/"/g, '\\"')}",`);
  lines.push(`  type: "${set.type}",`);
  lines.push(`  source: "${set.source.replace(/"/g, '\\"')}", // TODO enrich if useful`);
  lines.push(`  dlcRequired: ${set.dlcRequired === null ? "null" : `"${set.dlcRequired}"`},`);
  if (set.type === "mythic") lines.push(`  mythicSlot: "necklace", // TODO set the real mythic slot`);
  lines.push(`  bonuses: [`);
  for (const bonus of [...set.bonuses].sort((a, b) => a.pieces - b.pieces)) {
    const ls = matchLeadingStat(bonus.effect);
    if (ls && ls.pure) {
      lines.push(`    b(${bonus.pieces}, "${statEffectText(ls)}", [${statDeltaLiteral(ls)}]),`);
    } else if (ls) {
      const clean = bonus.effect.replace(/\s+/g, " ").replace(/"/g, "'").trim();
      lines.push(`    // ref (paraphrase, keep "${ls.statName}" in the wording): ${clean}`);
      lines.push(`    b(${bonus.pieces}, "TODO paraphrase", [${statDeltaLiteral(ls)}]),`);
    } else {
      const clean = bonus.effect.replace(/\s+/g, " ").replace(/"/g, "'").trim();
      lines.push(`    // ref (paraphrase — do not copy): ${clean}`);
      lines.push(`    b(${bonus.pieces}, "TODO paraphrase"),`);
    }
  }
  lines.push(`  ],`);
  // Provenance from the artifact's own patch — never hard-coded, so entries
  // scaffolded from a later dataset don't carry false "first seen" history.
  lines.push(`  firstSeenPatch: "${patchCode}", // TODO: set earlier if this entity predates the current artifact`);
  lines.push(`  lastChangedPatch: "${patchCode}",`);
  lines.push(`},`);
  return lines.join("\n");
}

export function loadArtifact(root = process.cwd()): {
  sets: ArtifactSet[];
  skills: ArtifactSkill[];
  patch: { code: string };
} {
  return JSON.parse(readFileSync(resolve(root, "public/dataset/current.json"), "utf8"));
}

function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Usage: npx tsx scripts/scaffold-entities.ts <set-id|skill-id> [...]");
    process.exit(1);
  }
  const { sets, skills, patch } = loadArtifact();
  const setById = new Map(sets.map((s) => [s.id, s]));
  const skillById = new Map(skills.map((s) => [s.id, s]));

  // Keep processing every id, but remember failures so the CLI exits nonzero —
  // a refused passive or unknown id must be detectable by a calling script.
  let failed = 0;
  for (const id of ids) {
    console.log(`\n/* ---- ${id} ---- */`);
    try {
      if (id.startsWith("set-")) {
        const s = setById.get(id);
        if (!s) throw new Error(`${id} not found in the artifact`);
        console.log(scaffoldSet(s, patch.code));
      } else if (id.startsWith("skill-")) {
        const s = skillById.get(id);
        if (!s) throw new Error(`${id} not found in the artifact`);
        console.log(scaffoldSkill(s, patch.code));
      } else {
        throw new Error(`unknown id prefix (expected set-… or skill-…): ${id}`);
      }
    } catch (err) {
      const message = (err as Error).message;
      console.log(`// SKIPPED: ${message}`);
      console.error(`scaffold: skipped ${id} — ${message}`);
      failed += 1;
    }
  }
  if (failed > 0) process.exit(1);
}

// Run only as a CLI, not when imported by the test.
if (process.argv[1] && /scaffold-entities\.ts$/.test(process.argv[1])) main();
