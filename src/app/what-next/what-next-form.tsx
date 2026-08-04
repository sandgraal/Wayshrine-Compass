"use client";

import { useMemo, useState } from "react";
import { Check, Clock, Sparkles, Undo2, X } from "lucide-react";
import type { NextAction, PlayerGoal, PlayerPlatform, PlayerProfile } from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";
import { selectActions } from "./select-actions";
import { useWhatNextProfile, useWhatNextProgress } from "./progress-store";
import { ActionThumb } from "./action-thumb";
import { companions } from "@/data/companions";
import { ALL_DLC_IDS } from "@/data/zones";
import { cn } from "@/lib/utils";

const GOALS: { id: PlayerGoal; label: string }[] = [
  { id: "leveling", label: "Leveling up" },
  { id: "gold", label: "Making gold" },
  { id: "solo-overland", label: "Solo & story" },
  { id: "dungeons", label: "Dungeons" },
  { id: "trials", label: "Trials" },
  { id: "pvp", label: "PvP" },
];

const PLATFORMS: { id: PlayerPlatform; label: string }[] = [
  { id: "pc", label: "PC" },
  { id: "xbox", label: "Xbox" },
  { id: "playstation", label: "PlayStation" },
];

const DLC_LABELS: Record<string, string> = {
  "imperial-city": "Imperial City",
  orsinium: "Orsinium",
  "thieves-guild": "Thieves Guild",
  "dark-brotherhood": "Dark Brotherhood",
  "shadows-of-the-hist": "Shadows of the Hist",
  morrowind: "Morrowind",
  "horns-of-the-reach": "Horns of the Reach",
  "clockwork-city": "Clockwork City",
  "dragon-bones": "Dragon Bones",
  summerset: "Summerset",
  wolfhunter: "Wolfhunter",
  murkmire: "Murkmire",
  wrathstone: "Wrathstone",
  elsweyr: "Elsweyr",
  scalebreaker: "Scalebreaker",
  dragonhold: "Dragonhold",
  harrowstorm: "Harrowstorm",
  greymoor: "Greymoor",
  stonethorn: "Stonethorn",
  markarth: "Markarth",
  "flames-of-ambition": "Flames of Ambition",
  blackwood: "Blackwood",
  "waking-flame": "Waking Flame",
  deadlands: "Deadlands",
  "ascending-tide": "Ascending Tide",
  "high-isle": "High Isle",
  "lost-depths": "Lost Depths",
  firesong: "Firesong",
  "scribes-of-fate": "Scribes of Fate",
  necrom: "Necrom",
  "scions-of-ithelia": "Scions of Ithelia",
  "gold-road": "Gold Road",
  "seasons-of-the-worm-cult": "Worm Cult (2025)",
};

const DEFAULT_PROFILE: PlayerProfile = {
  platform: "xbox",
  className: "sorcerer",
  level: 6,
  cp: 0,
  esoPlus: true,
  dlcOwned: [],
  companionsOwned: [],
  goal: "leveling",
  hoursPerWeek: 5,
};

export function WhatNextForm() {
  const { storedProfile, saveProfile } = useWhatNextProfile();
  const { progress, markDone, unmarkDone, dismiss, undismiss, resetProgress } = useWhatNextProgress();
  // Edits before the first submission stay local; the first submission
  // persists the profile, and from then on results recompute live on every
  // edit instead of blanking (the stored profile doubles as "submitted").
  const [draft, setDraft] = useState<PlayerProfile | null>(null);
  const submitted = storedProfile !== null;
  const profile = draft ?? storedProfile ?? DEFAULT_PROFILE;

  const selected = useMemo(
    () => (submitted ? selectActions(profile, progress) : null),
    [submitted, profile, progress]
  );

  const set = <K extends keyof PlayerProfile>(key: K, value: PlayerProfile[K]) => {
    const next = { ...profile, [key]: value };
    if (submitted) {
      saveProfile(next);
      setDraft(null);
    } else {
      setDraft(next);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <Field label="Platform">
          <ChipGroup
            options={PLATFORMS.map((p) => ({ id: p.id, label: p.label }))}
            value={profile.platform}
            onChange={(v) => set("platform", v as PlayerPlatform)}
          />
        </Field>

        <Field label="Class">
          <ChipGroup
            options={ALL_CLASSES.map((c) => ({ id: c, label: c }))}
            value={profile.className}
            onChange={(v) => set("className", v as PlayerProfile["className"])}
            capitalize
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={`Level: ${profile.level}`}>
            <input
              type="range"
              min={1}
              max={50}
              value={profile.level}
              onChange={(e) => set("level", Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </Field>
          <Field label={`Champion Points: ${profile.cp}`}>
            <input
              type="range"
              min={0}
              max={3600}
              step={10}
              value={profile.cp}
              onChange={(e) => set("cp", Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
              disabled={profile.level < 50}
            />
          </Field>
        </div>

        <Field label="DLC access">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.esoPlus}
              onChange={(e) => set("esoPlus", e.target.checked)}
              className="accent-[var(--primary)]"
            />
            ESO Plus (grants all DLC)
          </label>
          {!profile.esoPlus && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALL_DLC_IDS.map((dlc) => (
                <Chip
                  key={dlc}
                  label={DLC_LABELS[dlc] ?? dlc}
                  active={profile.dlcOwned.includes(dlc)}
                  onClick={() =>
                    set(
                      "dlcOwned",
                      profile.dlcOwned.includes(dlc)
                        ? profile.dlcOwned.filter((d) => d !== dlc)
                        : [...profile.dlcOwned, dlc]
                    )
                  }
                />
              ))}
            </div>
          )}
        </Field>

        <Field label="Companions you already own">
          <div className="flex flex-wrap gap-1.5">
            {companions.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={profile.companionsOwned.includes(c.id)}
                onClick={() =>
                  set(
                    "companionsOwned",
                    profile.companionsOwned.includes(c.id)
                      ? profile.companionsOwned.filter((id) => id !== c.id)
                      : [...profile.companionsOwned, c.id]
                  )
                }
              />
            ))}
          </div>
        </Field>

        <Field label="Primary goal">
          <ChipGroup
            options={GOALS.map((g) => ({ id: g.id, label: g.label }))}
            value={profile.goal}
            onChange={(v) => set("goal", v as PlayerGoal)}
          />
        </Field>

        <Field label={`Weekly time budget: ~${profile.hoursPerWeek}h`}>
          <input
            type="range"
            min={1}
            max={30}
            value={profile.hoursPerWeek}
            onChange={(e) => set("hoursPerWeek", Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </Field>

        {!submitted && (
          <button
            onClick={() => saveProfile(profile)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="size-4" /> Show my next 5 actions
          </button>
        )}
      </div>

      {selected && (
        <div className="space-y-4">
          {selected.visible.length > 0 ? (
            <ol className="space-y-3">
              {selected.visible.map((action, i) => (
                <li key={action.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <ActionThumb actionId={action.id} />
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{action.why}</p>
                      <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="text-verified">Payoff: {action.payoff}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" /> {action.timeCost}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        onClick={() => {
                          markDone(action.id);
                          const companionMatch = action.id.match(/^unlock-companion-(.+)$/);
                          if (companionMatch) {
                            const companionId = companionMatch[1];
                            set("companionsOwned", [...new Set([...profile.companionsOwned, companionId])]);
                          }
                        }}
                        title="Mark as done"
                        className="inline-flex items-center gap-1 rounded-md border border-verified/40 px-2 py-1 text-xs text-verified hover:bg-verified/10"
                      >
                        <Check className="size-3" /> Done
                      </button>
                      <button
                        onClick={() => dismiss(action.id)}
                        title="Hide this suggestion"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                      >
                        <X className="size-3" /> Hide
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Nothing left to suggest for this profile: everything the engine recommends is marked
              done or hidden. Adjust the profile above, or reset your progress below.
            </p>
          )}

          {selected.completed.length > 0 && (
            <details className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Completed ({selected.completed.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {selected.completed.map((action) => (
                  <ProgressRow
                    key={action.id}
                    action={action}
                    undoLabel="Not done yet"
                    onUndo={() => unmarkDone(action.id)}
                    struck
                  />
                ))}
              </ul>
            </details>
          )}

          {selected.hidden.length > 0 && (
            <details className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Hidden ({selected.hidden.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {selected.hidden.map((action) => (
                  <ProgressRow
                    key={action.id}
                    action={action}
                    undoLabel="Show again"
                    onUndo={() => undismiss(action.id)}
                  />
                ))}
              </ul>
            </details>
          )}

          {(progress.done.length > 0 || progress.dismissed.length > 0) && (
            <button
              onClick={resetProgress}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Reset checklist progress
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressRow({
  action,
  undoLabel,
  onUndo,
  struck,
}: {
  action: NextAction;
  undoLabel: string;
  onUndo: () => void;
  struck?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className={cn("text-muted-foreground", struck && "line-through decoration-verified/60")}>
        {action.title}
      </span>
      <button
        onClick={onUndo}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
      >
        <Undo2 className="size-3" /> {undoLabel}
      </button>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick, capitalize }: { label: string; active: boolean; onClick: () => void; capitalize?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        capitalize && "capitalize",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
  capitalize,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  capitalize?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o.id} label={o.label} active={value === o.id} onClick={() => onChange(o.id)} capitalize={capitalize} />
      ))}
    </div>
  );
}
