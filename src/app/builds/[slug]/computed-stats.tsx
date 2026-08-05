import type { StatDelta } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DPS_MODEL, dpsAssumptions, type DpsEstimate } from "@/lib/planner/dps";
import type { ComputedStats } from "@/lib/planner/validate";

/**
 * The build's stat profile and DPS estimate, computed server-side from the same
 * pure engine the planner uses (computeStats + estimateDps), so the two always
 * agree. The DPS figure is an explicit MODEL, never a parse — it is framed as an
 * estimate with its assumptions and "not modeled" list surfaced, matching the
 * planner exactly.
 */
const STAT_ROWS: readonly [string, StatDelta["stat"]][] = [
  ["Max Health", "maxHealth"],
  ["Max Magicka", "maxMagicka"],
  ["Max Stamina", "maxStamina"],
  ["Weapon/Spell Damage", "weaponSpellDamage"],
  ["Critical Chance", "criticalChance"],
  ["Critical Damage %", "criticalDamage"],
  ["Penetration", "penetration"],
  ["Armor", "armor"],
];

export function ComputedStatsCard({ stats, dps }: { stats: ComputedStats; dps: DpsEstimate }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Computed stats</CardTitle>
        <CardDescription>
          Modeled from this build&apos;s gear, mundus, and food — an estimate, not a parse.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {STAT_ROWS.map(([label, key]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono">{Math.round(stats.totals[key]).toLocaleString()}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-muted-foreground">
          Naked CP160 baseline + flat set/mundus/food bonuses. Percent and proc bonuses fold into the
          DPS model below.
        </p>

        <div className="border-t border-border pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Est. sustained DPS</span>
            <span className="font-mono text-lg text-foreground">{dps.dps.toLocaleString()}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {dps.low.toLocaleString()}–{dps.high.toLocaleString()} · ±
            {Math.round(DPS_MODEL.errorBand * 100)}% — model, not a parse
          </p>
          <details className="mt-2 text-[11px] text-muted-foreground">
            <summary className="cursor-pointer select-none">Model assumptions</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {dpsAssumptions().map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
          {dps.notModeled.length > 0 && (
            <details className="mt-1 text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none">
                Not modeled — contributes 0 ({dps.notModeled.length})
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {dps.notModeled.map((b) => (
                  <li key={`${b.source}:${b.effect}`}>
                    <span className="text-foreground">{b.source}</span> — {b.effect}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Active set bonuses</p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {stats.activeBonuses.map((b) => (
              <li key={`${b.setName}:${b.pieces}`}>
                <span className="text-foreground">
                  {b.setName} ({b.pieces}pc)
                </span>{" "}
                — {b.effect}
              </li>
            ))}
            {stats.activeBonuses.length === 0 && <li>No set bonuses active.</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
