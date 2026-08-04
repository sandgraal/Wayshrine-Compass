"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Link2 } from "lucide-react";
import type { GearSlot } from "@/lib/types";
import { ALL_CLASSES, GEAR_SLOTS } from "@/lib/types";
import { computeFreshnessPreview } from "./freshness-preview";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { computeStats, validateGear, validateSubclassLines } from "@/lib/planner/validate";
import { DPS_MODEL, dpsAssumptions, estimateDps } from "@/lib/planner/dps";
import { cn } from "@/lib/utils";
import { ClassSigil } from "@/components/illustrations";
import { CharacterPicker } from "./character-picker";
import {
  type PlannerCpStar,
  type PlannerSet,
  type PlannerSkill,
  type PlannerState,
  TRAITS,
  decodeState,
  defaultState,
  encodeState,
  makeEntityTables,
  remapPortrait,
  sanitizeState,
  stateFromBuild,
  updateGearSlot,
} from "./planner-state";

const SLOT_LABEL: Record<GearSlot, string> = {
  head: "Head", shoulders: "Shoulders", chest: "Chest", hands: "Hands", waist: "Waist",
  legs: "Legs", feet: "Feet", necklace: "Necklace", ring1: "Ring 1", ring2: "Ring 2",
  frontBarWeapon: "Front bar weapon", backBarWeapon: "Back bar weapon",
};

export function Planner({
  currentPatch,
  liveSets,
  liveSkills,
  liveCpStars,
}: {
  currentPatch: string;
  /** The active data facade's catalog (Supabase when configured, seed otherwise),
   * slimmed server-side to the fields the planner reads. Every picker, legality
   * check, permalink sanitizer, and the freshness preview run against this one
   * source — the planner shows the same catalog /sets does. */
  liveSets: PlannerSet[];
  liveSkills: PlannerSkill[];
  liveCpStars: PlannerCpStar[];
}) {
  const searchParams = useSearchParams();
  const tables = useMemo(
    () => makeEntityTables({ sets: liveSets, skills: liveSkills, cpStars: liveCpStars }),
    [liveSets, liveSkills, liveCpStars]
  );
  const [state, setState] = useState<PlannerState>(() => {
    const encoded = searchParams.get("b");
    if (encoded) {
      const decoded = decodeState(encoded, tables);
      if (decoded) return decoded;
    }
    const from = searchParams.get("from");
    if (from) {
      // Seed-build fork, re-validated against the active catalog so ids the
      // catalog no longer contains drop instead of lingering as dead refs.
      const forked = sanitizeState(stateFromBuild(from), tables);
      if (forked) return forked;
    }
    return defaultState();
  });
  const [copied, setCopied] = useState(false);

  const issues = useMemo(
    () => [
      ...validateSubclassLines(state.className, state.lines),
      ...validateGear(state.gear, tables.setById),
      ...validateBarLines(state, tables.skillById),
    ],
    [state, tables]
  );

  const stats = useMemo(() => {
    const mundus = mundusStones.find((m) => m.id === state.mundusId)?.stats ?? [];
    const food = foods.find((f) => f.id === state.foodId)?.stats ?? [];
    return computeStats(state.gear, tables.setById, [mundus, food]);
  }, [state.gear, state.mundusId, state.foodId, tables]);

  const dps = useMemo(() => {
    const slottedCp = [...state.cp.warfare, ...state.cp.fitness, ...state.cp.craft]
      .map((id) => tables.cpStarById.get(id))
      .filter((s) => s !== undefined);
    return estimateDps(stats.totals, [
      ...stats.activeBonuses.map((b) => ({
        source: `${b.setName} (${b.pieces}pc)`,
        effect: b.effect,
        structured: (b.stats?.length ?? 0) > 0,
      })),
      ...slottedCp.map((s) => ({ source: `${s.name} (CP)`, effect: s.effect })),
    ]);
  }, [stats, state.cp, tables]);

  const availableSkills = useMemo(() => {
    const lineSet = new Set(state.lines);
    return tables.skills
      .filter(
        (s) =>
          s.passive !== true && (s.className === null || lineSet.has(`${s.className}/${s.line}`))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.lines, tables]);

  // Gear dropdown groups, one <optgroup> per set type. Sets arrive sorted by
  // name from the facade; group order is fixed for scanability.
  const setTypes = useMemo(() => {
    const order = ["crafted", "overland", "dungeon", "trial", "arena", "pvp", "monster", "mythic"];
    const byType = new Map<string, PlannerSet[]>();
    for (const s of tables.sets) {
      const group = byType.get(s.type) ?? [];
      group.push(s);
      byType.set(s.type, group);
    }
    // The facade returns source order (the Supabase query has no ORDER BY) —
    // sort every group so the native picker stays scannable.
    for (const group of byType.values()) group.sort((a, b) => a.name.localeCompare(b.name));
    const rank = (t: string) => {
      const i = order.indexOf(t);
      return i === -1 ? order.length : i;
    };
    return [...byType.entries()].sort(([a], [b]) => rank(a) - rank(b));
  }, [tables]);

  /**
   * Live freshness preview: any currently-slotted set, skill, or CP star that
   * changed in the current patch — or is missing from the live game data —
   * flags this draft, same conditions the real db.freshness() engine applies
   * to a saved Build, just evaluated against in-progress planner state.
   */
  const preview = useMemo(
    () =>
      computeFreshnessPreview(
        {
          setIds: state.gear.map((g) => g.setId),
          skillIds: [...state.bar.front, state.bar.frontUlt, ...state.bar.back, state.bar.backUlt].filter(Boolean),
          cpStarIds: [...state.cp.warfare, ...state.cp.fitness, ...state.cp.craft],
        },
        { setById: tables.setById, skillById: tables.skillById, cpStarById: tables.cpStarById },
        currentPatch
      ),
    [state.gear, state.bar, state.cp, currentPatch, tables]
  );

  const update = (patch: Partial<PlannerState>) => {
    setState((s) => ({ ...s, ...patch }));
    setCopied(false);
  };

  const setGearSlot = (slot: GearSlot, setId: string, trait?: string) => {
    setState((s) => ({ ...s, gear: updateGearSlot(s.gear, slot, setId, trait) }));
    setCopied(false);
  };

  async function copyPermalink() {
    const url = `${window.location.origin}/planner?b=${encodeState(state)}`;
    await navigator.clipboard.writeText(url);
    window.history.replaceState(null, "", `/planner?b=${encodeState(state)}`);
    setCopied(true);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Character portrait (cosmetic only) */}
        <CharacterPicker
          className={state.className}
          portraitId={state.portraitId}
          onSelect={(portraitId) => update({ portraitId })}
        />

        {/* Class + subclass lines */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="sigil-ring size-7">
              <ClassSigil name={state.className} className="size-3.5" />
            </span>
            Class &amp; skill lines
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALL_CLASSES.map((c) => (
              <button
                key={c}
                onClick={() =>
                  update({
                    className: c,
                    lines: tables.lines.filter((l) => l.id.startsWith(`${c}/`)).map((l) => l.id).slice(0, 3),
                    bar: { front: [], frontUlt: "", back: [], backUlt: "" },
                    portraitId: remapPortrait(state.portraitId, c),
                  })
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs capitalize",
                  state.className === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <select
                key={i}
                value={state.lines[i] ?? ""}
                onChange={(e) => {
                  const lines = [...state.lines];
                  lines[i] = e.target.value;
                  update({ lines: lines.filter(Boolean) });
                }}
                className="rounded-md border border-input bg-secondary px-2 py-1.5 text-sm"
              >
                {tables.lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Subclassing: swap up to two lines for other classes&apos; lines — at least one native line must remain.
          </p>
        </section>

        {/* Gear */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gear</h2>
          <div className="mt-2 space-y-1.5">
            {GEAR_SLOTS.map((slot) => {
              const current = state.gear.find((g) => g.slot === slot);
              return (
                <div key={slot} className="grid grid-cols-[110px_1fr_110px] items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">{SLOT_LABEL[slot]}</span>
                  <select
                    value={current?.setId ?? ""}
                    onChange={(e) => setGearSlot(slot, e.target.value)}
                    className="min-w-0 rounded-md border border-input bg-secondary px-2 py-1 text-xs"
                  >
                    <option value="">— empty —</option>
                    {setTypes.map(([type, group]) => (
                      <optgroup key={type} label={type[0].toUpperCase() + type.slice(1)}>
                        {group.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <select
                    value={current?.trait ?? "Divines"}
                    onChange={(e) => current && setGearSlot(slot, current.setId, e.target.value)}
                    disabled={!current}
                    className="rounded-md border border-input bg-secondary px-2 py-1 text-xs disabled:opacity-40"
                  >
                    {TRAITS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </section>

        {/* Skills */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill bars</h2>
          {(["front", "back"] as const).map((bar) => (
            <div key={bar} className="mt-2">
              <p className="mb-1 text-xs capitalize text-muted-foreground">{bar} bar</p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <select
                    key={i}
                    value={state.bar[bar][i] ?? ""}
                    onChange={(e) => {
                      const arr = [...state.bar[bar]];
                      arr[i] = e.target.value;
                      update({ bar: { ...state.bar, [bar]: arr } });
                    }}
                    className="rounded-md border border-input bg-secondary px-2 py-1 text-xs"
                  >
                    <option value="">— slot {i + 1} —</option>
                    {availableSkills
                      .filter((s) => !s.ultimate)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.lineLabel})
                        </option>
                      ))}
                  </select>
                ))}
                <select
                  value={bar === "front" ? state.bar.frontUlt : state.bar.backUlt}
                  onChange={(e) =>
                    update({ bar: { ...state.bar, [bar === "front" ? "frontUlt" : "backUlt"]: e.target.value } })
                  }
                  className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs"
                >
                  <option value="">— ultimate —</option>
                  {availableSkills
                    .filter((s) => s.ultimate)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.lineLabel})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </section>

        {/* CP / mundus / food */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Champion Points (4 slottables per tree)
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {(["warfare", "fitness", "craft"] as const).map((tree) => (
              <div key={tree}>
                <p className="mb-1 text-xs capitalize text-muted-foreground">{tree}</p>
                <div className="flex flex-wrap gap-1">
                  {tables.cpStars
                    .filter((s) => s.tree === tree && s.slottable)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((s) => {
                      const active = state.cp[tree].includes(s.id);
                      return (
                        <button
                          key={s.id}
                          title={s.effect}
                          onClick={() =>
                            update({
                              cp: {
                                ...state.cp,
                                [tree]: active
                                  ? state.cp[tree].filter((id) => id !== s.id)
                                  : state.cp[tree].length < 4
                                    ? [...state.cp[tree], s.id]
                                    : state.cp[tree],
                              },
                            })
                          }
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px]",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Mundus
              <select
                value={state.mundusId}
                onChange={(e) => update({ mundusId: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground"
              >
                {mundusStones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Food
              <select
                value={state.foodId}
                onChange={(e) => update({ foodId: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground"
              >
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      {/* Right rail: validation + stats + permalink */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <button
          onClick={copyPermalink}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? "Permalink copied" : "Copy shareable permalink"}
        </button>

        <section className={cn("rounded-lg border bg-card p-4", preview.status === "needs_review" ? "border-needs-review/40" : "border-border")}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Freshness preview</h2>
          <div className="mt-2 flex flex-col gap-3">
            {/* A draft is never "verified" — green is reserved for human-reviewed builds. */}
            {preview.status === "needs_review" ? (
              <>
                <PreviewPill tone="needs-review" label="Needs review" />
                <div className="rounded-md border border-needs-review/40 bg-needs-review/10 px-3 py-2 text-xs">
                  {preview.reasons.map((r) => (
                    <p key={`${r.entityType}-${r.entityId}`}>{r.summary}</p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <PreviewPill tone="neutral" label={`No ${currentPatch} changes detected`} />
                <p className="text-xs text-muted-foreground">
                  Nothing slotted in this draft has moved in {currentPatch}. Published builds earn a
                  green badge only after human review.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legality</h2>
          {errors.length === 0 && warnings.length === 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-verified">
              <Check className="size-4" /> No issues found
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-xs">
              {errors.map((i, n) => (
                <li key={n} className="flex items-start gap-1.5 text-stale">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {i.message}
                </li>
              ))}
              {warnings.map((i, n) => (
                <li key={n} className="flex items-start gap-1.5 text-needs-review">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {i.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Computed stats</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {(
              [
                ["Max Health", "maxHealth"],
                ["Max Magicka", "maxMagicka"],
                ["Max Stamina", "maxStamina"],
                ["Weapon/Spell Damage", "weaponSpellDamage"],
                ["Critical Chance", "criticalChance"],
                ["Critical Damage %", "criticalDamage"],
                ["Penetration", "penetration"],
                ["Armor", "armor"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono">{Math.round(stats.totals[key]).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Naked CP160 baseline + flat set/mundus/food bonuses. Percent and proc bonuses listed below.
          </p>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Est. sustained DPS</span>
              <span className="font-mono text-lg text-foreground">{dps.dps.toLocaleString()}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {dps.low.toLocaleString()}–{dps.high.toLocaleString()} · ±{Math.round(DPS_MODEL.errorBand * 100)}% —
              model, not a parse
            </p>
            <details className="mt-2 text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none">Model assumptions</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {dpsAssumptions().map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </details>
            {dps.notModeled.length > 0 && (
              <details className="mt-1 text-[11px] text-muted-foreground">
                <summary className="cursor-pointer select-none">
                  Not modeled — contributes 0 ({dps.notModeled.length})
                </summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {dps.notModeled.map((b, i) => (
                    <li key={i}>
                      <span className="text-foreground">{b.source}</span> — {b.effect}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active set bonuses</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {stats.activeBonuses.map((b, i) => (
              <li key={i}>
                <span className="text-foreground">
                  {b.setName} ({b.pieces}pc)
                </span>{" "}
                — {b.effect}
              </li>
            ))}
            {stats.activeBonuses.length === 0 && <li>No set bonuses active yet.</li>}
          </ul>
        </section>
      </aside>
    </div>
  );
}

/** Preview counterpart of FreshnessBadge — same pill shape, but with a neutral
 * (never green) resting state, since a draft carries no review provenance. */
function PreviewPill({ tone, label }: { tone: "needs-review" | "neutral"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "needs-review"
          ? "border-needs-review/40 bg-needs-review/15 text-needs-review"
          : "border-border bg-secondary text-muted-foreground"
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone === "needs-review" ? "bg-needs-review" : "bg-muted-foreground")} />
      {label}
    </span>
  );
}

function validateBarLines(state: PlannerState, skillById: ReadonlyMap<string, { name: string; lineLabel: string; className: string | null; line: string }>) {
  const lineSet = new Set(state.lines);
  const issues: { severity: "error" | "warning"; code: string; message: string }[] = [];
  const allSlotted = [
    ...state.bar.front,
    state.bar.frontUlt,
    ...state.bar.back,
    state.bar.backUlt,
  ].filter(Boolean);
  for (const id of allSlotted) {
    const skill = skillById.get(id);
    if (!skill) continue;
    if (skill.className && !lineSet.has(`${skill.className}/${skill.line}`)) {
      issues.push({
        severity: "error",
        code: "skill-line-unavailable",
        message: `${skill.name} needs the ${skill.lineLabel} line, which isn't among your three lines.`,
      });
    }
  }
  const dupes = allSlotted.filter((id, i) => allSlotted.indexOf(id) !== i);
  if (dupes.length > 0) {
    const name = skillById.get(dupes[0])?.name ?? dupes[0];
    issues.push({ severity: "error", code: "duplicate-skill", message: `${name} is slotted more than once.` });
  }
  return issues;
}
