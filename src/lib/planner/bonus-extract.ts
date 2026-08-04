import type { StatDelta } from "@/lib/types";

/**
 * Tolerant numeric extractor for set-bonus / CP-star effect text.
 *
 * Dataset bonus strings are real U50 tooltips: flat stats read
 * "Adds 657 Critical Chance" or, for level-scaled datamined values,
 * "Adds 25-1096 Maximum Stamina" — the range's upper end is the CP160
 * value, which is what the planner models. Seed CP/mundus wording uses
 * "Increases Armor by 1980" instead.
 *
 * The extractor is deliberately all-or-nothing and conservative: any
 * clause it cannot map to a known stat, or any conditional qualifier
 * ("while…", "to your X abilities", "based on missing…"), makes the
 * whole effect unmodeled (`null`). Callers list unmodeled effects
 * explicitly rather than silently dropping them.
 */
export type ExtractedEffect =
  /** Unconditional flat stat contribution(s); `criticalDamage` amounts are percent points. */
  | { kind: "flat"; deltas: StatDelta[] }
  /** Rotation-scoped "+N% damage" (e.g. "with single target attacks") — only part of a rotation benefits. */
  | { kind: "damage-pct"; scope: string; pct: number };

/** Tooltip stat names → structured stats, longest-first so prefixes match greedily. */
const STAT_NAMES: [name: string, stat: StatDelta["stat"]][] = [
  ["Physical and Spell Penetration", "penetration"],
  ["Physical and Spell Resistance", "armor"],
  ["Weapon and Spell Damage", "weaponSpellDamage"],
  ["Offensive Penetration", "penetration"],
  ["Maximum Magicka", "maxMagicka"],
  ["Maximum Stamina", "maxStamina"],
  ["Maximum Health", "maxHealth"],
  ["Max Magicka", "maxMagicka"],
  ["Max Stamina", "maxStamina"],
  ["Max Health", "maxHealth"],
  ["Critical Chance", "criticalChance"],
  ["Magicka Recovery", "magickaRecovery"],
  ["Stamina Recovery", "staminaRecovery"],
  ["Health Recovery", "healthRecovery"],
  ["Armor", "armor"],
];

function matchStatName(s: string): { stat: StatDelta["stat"]; len: number } | null {
  for (const [name, stat] of STAT_NAMES) {
    if (s.startsWith(name)) {
      const next = s[name.length];
      // Word boundary so "Armor" never matches inside e.g. "Armory".
      if (next === undefined || next === " " || next === ",") return { stat, len: name.length };
    }
  }
  return null;
}

/** "25-1096" scaling ranges: the upper end is the CP160 value. */
function cp160(lo: string, hi: string | undefined): number {
  return Math.max(Number(lo), Number(hi ?? 0));
}

export function extractEffect(effect: string): ExtractedEffect | null {
  const e = effect.trim().replace(/\.\s*$/, "");

  // "Adds 657 Critical Chance[ and 129 Weapon and Spell Damage…]"
  const adds = e.match(/^Adds (.+)$/);
  if (adds) {
    let rest = adds[1];
    const deltas: StatDelta[] = [];
    while (rest) {
      // e.g. "Adds 877 Critical Chance and increases your Critical Damage by 4%"
      // (the list-separator "and" is consumed below before this clause comes up)
      const critTail = rest.match(/^increases your Critical Damage by (\d+)(?:-(\d+))?%$/i);
      if (critTail && deltas.length > 0) {
        deltas.push({ stat: "criticalDamage", amount: cp160(critTail[1], critTail[2]) });
        break;
      }
      const num = rest.match(/^(\d+)(?:-(\d+))?\s+/);
      if (!num) return null;
      rest = rest.slice(num[0].length);
      const stat = matchStatName(rest);
      if (!stat) return null;
      deltas.push({ stat: stat.stat, amount: cp160(num[1], num[2]) });
      rest = rest.slice(stat.len);
      if (!rest) break;
      // Anything but a plain list separator ("while…", "to your X abilities") → conditional → unmodeled.
      const sep = rest.match(/^(?:,\s*(?:and\s+)?|\s+and\s+)/);
      if (!sep) return null;
      rest = rest.slice(sep[0].length);
    }
    return deltas.length > 0 ? { kind: "flat", deltas } : null;
  }

  // "Increases Critical Damage and Critical Healing by 8%" (sets, CP, mundus)
  const critPct = e.match(/^Increases (?:your )?Critical Damage(?: and Critical Healing)?(?: done)? by (\d+)(?:-(\d+))?%$/);
  if (critPct) return { kind: "flat", deltas: [{ stat: "criticalDamage", amount: cp160(critPct[1], critPct[2]) }] };

  // "Increases Armor by 1980" / "Increases Maximum Health by 1560" (seed CP/mundus wording)
  const incFlat = e.match(/^Increases ([^.%]+?) by (\d+)(?:-(\d+))?$/);
  if (incFlat) {
    const stat = matchStatName(incFlat[1]);
    if (stat && stat.len === incFlat[1].length)
      return { kind: "flat", deltas: [{ stat: stat.stat, amount: cp160(incFlat[2], incFlat[3]) }] };
  }

  // "Increases damage done with single target attacks by 10%" /
  // "Increases damage of your damage-over-time and channeled abilities by 15%"
  // Scope must be period/percent-free so multi-sentence effects stay unmodeled.
  const dmgPct = e.match(/^Increases (?:your )?damage (?:done )?(?:with|of) (?:your )?([^.%]+?) by (\d+)(?:-(\d+))?%$/);
  if (dmgPct) return { kind: "damage-pct", scope: dmgPct[1], pct: cp160(dmgPct[2], dmgPct[3]) };

  return null;
}
