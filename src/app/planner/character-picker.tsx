"use client";

import { useState } from "react";
import type { ClassName } from "@/lib/types";
import {
  ALL_RACES,
  type Gender,
  type Race,
  portraitById,
  portraitsMatching,
} from "@/lib/portraits";
import { CharacterPortrait } from "@/components/character-portrait";
import { ClassSigil } from "@/components/illustrations";
import { cn } from "@/lib/utils";

/**
 * Cosmetic character picker (design mockup 1b): race + gender chips narrow the
 * portrait catalog for the draft's class; variant thumbnails pick the art.
 * Only the chosen portrait id lives in planner state (and thus the permalink) —
 * race and gender are derived locally so an unselected picker adds nothing to
 * the shared URL.
 */
export function CharacterPicker({
  className,
  portraitId,
  onSelect,
}: {
  className: ClassName;
  portraitId: string | undefined;
  onSelect: (portraitId: string | undefined) => void;
}) {
  const selected = portraitId ? portraitById(portraitId) : undefined;
  // Local browsing state, seeded from the selection when present.
  const [race, setRace] = useState<Race>(selected?.race ?? "nord");
  const [gender, setGender] = useState<Gender>(selected?.gender ?? "female");

  const variants = portraitsMatching({ race, gender, className });

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Character
        </h2>
        <span className="text-xs text-muted-foreground">
          Cosmetic only — portraits never affect stats or freshness
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {ALL_RACES.map((r) => (
              <button
                key={r}
                onClick={() => setRace(r)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs capitalize",
                  race === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["female", "male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn(
                  "flex-1 rounded-md border px-2.5 py-1.5 text-xs capitalize sm:flex-none sm:px-6",
                  gender === g
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.length === 0 ? (
              <div className="flex h-24 w-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-secondary text-center">
                <ClassSigil name={className} className="size-6 text-primary/40" />
                <span className="px-1 text-[10px] leading-tight text-muted-foreground">
                  No art yet
                </span>
              </div>
            ) : (
              variants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id === portraitId ? undefined : p.id)}
                  title={p.id === portraitId ? "Deselect portrait" : `Use portrait ${p.variant}`}
                  className={cn(
                    "overflow-hidden rounded-lg border-2 transition-opacity",
                    p.id === portraitId
                      ? "border-primary"
                      : "border-border opacity-70 hover:opacity-100"
                  )}
                >
                  <CharacterPortrait
                    portrait={p}
                    sizes="4.5rem"
                    objectPosition="center 10%"
                    className="h-24 w-[4.5rem]"
                  />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="sm:w-40">
          {selected ? (
            <CharacterPortrait
              portrait={selected}
              sizes="10rem"
              className="aspect-[3/4] w-full rounded-lg border border-border"
            >
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-black/75" />
              <div className="absolute inset-x-2 bottom-1.5 text-center">
                <span className="text-xs font-semibold capitalize text-white">
                  {selected.race} {selected.className}
                </span>
              </div>
            </CharacterPortrait>
          ) : (
            <div className="bg-rune-field flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
              <ClassSigil name={className} className="size-8 text-primary/40" />
              <span className="px-3 text-xs text-muted-foreground">Pick a portrait</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
