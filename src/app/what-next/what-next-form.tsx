"use client";

import { useMemo, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import type { PlayerGoal, PlayerPlatform, PlayerProfile } from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";
import { whatNext } from "@/lib/engine/whatNext";
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
  morrowind: "Morrowind",
  summerset: "Summerset",
  elsweyr: "Elsweyr",
  blackwood: "Blackwood",
  "high-isle": "High Isle",
  firesong: "Firesong",
  necrom: "Necrom",
  "gold-road": "Gold Road",
  "seasons-of-the-worm-cult": "Worm Cult (2025)",
};

export function WhatNextForm() {
  const [profile, setProfile] = useState<PlayerProfile>({
    platform: "xbox",
    className: "sorcerer",
    level: 6,
    cp: 0,
    esoPlus: true,
    dlcOwned: [],
    companionsOwned: [],
    goal: "leveling",
    hoursPerWeek: 5,
  });
  const [submitted, setSubmitted] = useState(false);

  const actions = useMemo(() => (submitted ? whatNext(profile) : []), [submitted, profile]);

  const set = <K extends keyof PlayerProfile>(key: K, value: PlayerProfile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setSubmitted(false);
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

        <button
          onClick={() => setSubmitted(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Sparkles className="size-4" /> Show my next 5 actions
        </button>
      </div>

      {submitted && (
        <ol className="space-y-3">
          {actions.map((action, i) => (
            <li key={action.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <ActionThumb actionId={action.id} />
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{action.why}</p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="text-verified">Payoff: {action.payoff}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {action.timeCost}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
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
