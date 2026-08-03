"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Link2 } from "lucide-react";
import type { ClassName, CpStar, CpTree, GearAssignment, GearSet, GearSlot, Skill } from "@/lib/types";
import { ALL_CLASSES, GEAR_SLOTS } from "@/lib/types";
import { computeFreshnessPreview } from "./freshness-preview";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { buildBySlug } from "@/data/builds";
import { computeStats, validateGear, validateSubclassLines } from "@/lib/planner/validate";
import { cn } from "@/lib/utils";
import { ClassSigil } from "@/components/illustrations";

const TRAITS = ["Divines", "Sturdy", "Training", "Infused", "Bloodthirsty", "Arcane", "Robust", "Precise", "Defending", "Powered", "Nirnhoned", "Charged", "Sharpened"];

const SLOT_LABEL: Record<GearSlot, string> = {
  head: "Head", shoulders: "Shoulders", chest: "Chest", hands: "Hands", waist: "Waist",
  legs: "Legs", feet: "Feet", necklace: "Necklace", ring1: "Ring 1", ring2: "Ring 2",
  frontBarWeapon: "Front bar weapon", backBarWeapon: "Back bar weapon",
};

interface PlannerState {
  className: ClassName;
  lines: string[]; // up to 3 "class/line"
  gear: GearAssignment[];
  bar: { front: string[]; frontUlt: string; back: string[]; backUlt: string };
  cp: Record<CpTree, string[]>;
  mundusId: string;
  foodId: string;
}

const setById = new Map(sets.map((s) => [s.id, s]));

const allLines = (() => {
  const seen = new Map<string, string>();
  for (const s of skills) {
    if (s.className) seen.set(`${s.className}/${s.line}`, `${s.className[0].toUpperCase()}${s.className.slice(1)} — ${s.lineLabel}`);
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }));
})();

function defaultState(): PlannerState {
  return {
    className: "sorcerer",
    lines: ["sorcerer/dark-magic", "sorcerer/daedric-summoning", "sorcerer/storm-calling"],
    gear: [],
    bar: { front: [], frontUlt: "", back: [], backUlt: "" },
    cp: { warfare: [], fitness: [], craft: [] },
    mundusId: "mundus-thief",
    foodId: "food-bewitched-sugar-skulls",
  };
}

function stateFromBuild(slug: string): PlannerState | null {
  const b = buildBySlug.get(slug);
  if (!b) return null;
  return {
    className: b.className,
    lines: [...b.subclassLines],
    gear: b.gear.map((g) => ({ ...g })),
    bar: { front: [...b.frontBar.skills], frontUlt: b.frontBar.ultimate, back: [...b.backBar.skills], backUlt: b.backBar.ultimate },
    cp: { warfare: [...b.cp.warfare], fitness: [...b.cp.fitness], craft: [...b.cp.craft] },
    mundusId: b.mundusId,
    foodId: b.foodId,
  };
}

function encodeState(s: PlannerState): string {
  return encodeURIComponent(btoa(JSON.stringify(s)));
}

function decodeState(raw: string): PlannerState | null {
  try {
    return sanitizeState(JSON.parse(atob(decodeURIComponent(raw))));
  } catch {
    return null;
  }
}

/**
 * The `b` query param is user-controlled input. Rebuild a well-formed state
 * from it, keeping only ids that exist in the entity database — a crafted
 * URL must degrade to a partial build, never crash the page.
 */
function sanitizeState(parsed: unknown): PlannerState | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const className = o.className as ClassName;
  if (!ALL_CLASSES.includes(className)) return null;

  const strings = (v: unknown, keep: (s: string) => boolean, max: number): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && keep(x)).slice(0, max)
      : [];

  const isLine = (s: string) => allLines.some((l) => l.id === s);
  const isActive = (s: string) => skills.some((sk) => sk.id === s && !sk.ultimate);
  const isUlt = (v: unknown): v is string =>
    typeof v === "string" && skills.some((sk) => sk.id === v && sk.ultimate);
  const cpIn = (tree: CpTree) => (s: string) =>
    cpStars.some((c) => c.id === s && c.tree === tree && c.slottable);

  const gear: GearAssignment[] = [];
  if (Array.isArray(o.gear)) {
    for (const raw of o.gear.slice(0, GEAR_SLOTS.length * 2)) {
      if (!raw || typeof raw !== "object") continue;
      const g = raw as Record<string, unknown>;
      const slot = g.slot as GearSlot;
      if (!GEAR_SLOTS.includes(slot)) continue;
      if (typeof g.setId !== "string" || !setById.has(g.setId)) continue;
      if (gear.some((existing) => existing.slot === slot)) continue;
      const trait = typeof g.trait === "string" && TRAITS.includes(g.trait) ? g.trait : "Divines";
      gear.push({ slot, setId: g.setId, trait });
    }
  }

  const bar = (o.bar && typeof o.bar === "object" ? o.bar : {}) as Record<string, unknown>;
  const cp = (o.cp && typeof o.cp === "object" ? o.cp : {}) as Record<string, unknown>;

  return {
    className,
    lines: strings(o.lines, isLine, 3),
    gear,
    bar: {
      front: strings(bar.front, isActive, 5),
      frontUlt: isUlt(bar.frontUlt) ? bar.frontUlt : "",
      back: strings(bar.back, isActive, 5),
      backUlt: isUlt(bar.backUlt) ? bar.backUlt : "",
    },
    cp: {
      warfare: strings(cp.warfare, cpIn("warfare"), 4),
      fitness: strings(cp.fitness, cpIn("fitness"), 4),
      craft: strings(cp.craft, cpIn("craft"), 4),
    },
    mundusId:
      typeof o.mundusId === "string" && mundusStones.some((m) => m.id === o.mundusId)
        ? o.mundusId
        : defaultState().mundusId,
    foodId:
      typeof o.foodId === "string" && foods.some((f) => f.id === o.foodId)
        ? o.foodId
        : defaultState().foodId,
  };
}

export function Planner({
  currentPatch,
  liveSets,
  liveSkills,
  liveCpStars,
}: {
  currentPatch: string;
  /** The active data facade's sets/skills/CP stars (Supabase when configured, seed otherwise) —
   * used for the freshness preview so its "changed this patch" check reads from the same source
   * as `currentPatch`, instead of always the statically-imported seed data used for the rest of
   * the planner's dropdowns and legality checks. */
  liveSets: GearSet[];
  liveSkills: Skill[];
  liveCpStars: CpStar[];
}) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PlannerState>(() => {
    const encoded = searchParams.get("b");
    if (encoded) {
      const decoded = decodeState(encoded);
      if (decoded) return decoded;
    }
    const from = searchParams.get("from");
    if (from) {
      const forked = stateFromBuild(from);
      if (forked) return forked;
    }
    return defaultState();
  });
  const [copied, setCopied] = useState(false);

  const issues = useMemo(
    () => [
      ...validateSubclassLines(state.className, state.lines),
      ...validateGear(state.gear, setById),
      ...validateBarLines(state),
    ],
    [state]
  );

  const stats = useMemo(() => {
    const mundus = mundusStones.find((m) => m.id === state.mundusId)?.stats ?? [];
    const food = foods.find((f) => f.id === state.foodId)?.stats ?? [];
    return computeStats(state.gear, setById, [mundus, food]);
  }, [state.gear, state.mundusId, state.foodId]);

  const availableSkills = useMemo(() => {
    const lineSet = new Set(state.lines);
    return skills.filter((s) => s.className === null || lineSet.has(`${s.className}/${s.line}`));
  }, [state.lines]);

  /**
   * Live freshness preview: any currently-slotted set, skill, or CP star that
   * changed in the current patch — or is missing from the live game data —
   * flags this draft, same conditions the real db.freshness() engine applies
   * to a saved Build, just evaluated against in-progress planner state.
   */
  const liveSetById = useMemo(() => new Map(liveSets.map((s) => [s.id, s])), [liveSets]);
  const liveSkillById = useMemo(() => new Map(liveSkills.map((s) => [s.id, s])), [liveSkills]);
  const liveCpStarById = useMemo(() => new Map(liveCpStars.map((s) => [s.id, s])), [liveCpStars]);

  const preview = useMemo(
    () =>
      computeFreshnessPreview(
        {
          setIds: state.gear.map((g) => g.setId),
          skillIds: [...state.bar.front, state.bar.frontUlt, ...state.bar.back, state.bar.backUlt].filter(Boolean),
          cpStarIds: [...state.cp.warfare, ...state.cp.fitness, ...state.cp.craft],
        },
        { setById: liveSetById, skillById: liveSkillById, cpStarById: liveCpStarById },
        currentPatch
      ),
    [state.gear, state.bar, state.cp, currentPatch, liveSetById, liveSkillById, liveCpStarById]
  );

  const update = (patch: Partial<PlannerState>) => {
    setState((s) => ({ ...s, ...patch }));
    setCopied(false);
  };

  const setGearSlot = (slot: GearSlot, setId: string, trait?: string) => {
    setState((s) => {
      const gear = s.gear.filter((g) => g.slot !== slot);
      if (setId) gear.push({ slot, setId, trait: trait ?? s.gear.find((g) => g.slot === slot)?.trait ?? "Divines" });
      return { ...s, gear };
    });
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
                    lines: allLines.filter((l) => l.id.startsWith(`${c}/`)).map((l) => l.id).slice(0, 3),
                    bar: { front: [], frontUlt: "", back: [], backUlt: "" },
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
                {allLines.map((l) => (
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
                    {sets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.type === "mythic" ? " (Mythic)" : s.type === "monster" ? " (Monster)" : ""}
                      </option>
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
                  {cpStars
                    .filter((s) => s.tree === tree && s.slottable)
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

function validateBarLines(state: PlannerState) {
  const lineSet = new Set(state.lines);
  const issues: { severity: "error" | "warning"; code: string; message: string }[] = [];
  const allSlotted = [
    ...state.bar.front,
    state.bar.frontUlt,
    ...state.bar.back,
    state.bar.backUlt,
  ].filter(Boolean);
  for (const id of allSlotted) {
    const skill = skills.find((s) => s.id === id);
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
    const name = skills.find((s) => s.id === dupes[0])?.name ?? dupes[0];
    issues.push({ severity: "error", code: "duplicate-skill", message: `${name} is slotted more than once.` });
  }
  return issues;
}
