"use client";

import { useEffect, useState } from "react";
import { ALL_CLASSES, type ClassName, type PatchCode, type Skill } from "@/lib/types";
import { entityChangeStatus } from "@/lib/freshness";
import { EntityChangeBadge } from "@/components/entity-change-badge";
import { EntitySigil } from "@/components/entity-sigil";
import { skillLineArt } from "@/lib/entity-art";
import { ClassSigil } from "@/components/illustrations";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SkillRow({ s, patchOrder }: { s: Skill; patchOrder: PatchCode[] }) {
  // Neutral "tracked since" state renders no pill here: in a card list the
  // absence of a badge is the calm default, and a pill only appears when
  // there is an observed change (or a post-baseline addition) to report.
  const status = entityChangeStatus(s, patchOrder);
  return (
    <div id={s.id} className="flex scroll-mt-24 flex-col gap-1.5 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-sm font-medium", s.ultimate && "text-primary")}>{s.name}</span>
        <Badge variant={s.ultimate ? "default" : "secondary"}>{s.ultimate ? "Ultimate" : "Active"}</Badge>
        {status.kind !== "tracked" && <EntityChangeBadge entity={s} patchOrder={patchOrder} />}
      </div>
      {/* whitespace-pre-line: datamined tooltips carry \n\n between the flavor
          line and the mechanics — without it they run together. */}
      <p className="whitespace-pre-line text-sm text-muted-foreground">{s.description}</p>
      {/* Morphs as chips, and only when present — 233 passives have none and a
          bare <p> left ragged empty gaps. */}
      {s.morphs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Morphs:</span>
          {s.morphs.map((m) => (
            <span
              key={m.name}
              className="rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillsExplorer({
  skills,
  currentPatch,
  patchOrder,
}: {
  skills: Skill[];
  currentPatch: string;
  patchOrder: PatchCode[];
}) {
  const [cls, setCls] = useState<ClassName>(ALL_CLASSES[0]);

  // Deep links (/skills#<skill-id>, e.g. from the patch tracker) target rows
  // that only render for the selected class — switch the selector to the
  // target's class, then scroll once that render commits. The initial run is
  // deferred with setTimeout (reliable even in a background tab, unlike rAF)
  // and hash changes come through an event callback, so this never sets state
  // synchronously inside the effect body (react-hooks lint).
  useEffect(() => {
    const navigateToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = skills.find((s) => s.id === id);
      if (target?.className) setCls(target.className);
      // Scroll after the class-switch render has committed the target row, and
      // open the containing <details> for weapon/guild lines (their rows are
      // hidden while collapsed, so scrollIntoView would otherwise no-op).
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.closest("details")?.setAttribute("open", "");
        el?.scrollIntoView({ block: "center" });
      }, 50);
    };
    const initial = setTimeout(navigateToHash, 0);
    window.addEventListener("hashchange", navigateToHash);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("hashchange", navigateToHash);
    };
  }, [skills]);

  const classSkills = skills.filter((s) => s.className === cls);
  const lines = [...new Set(classSkills.map((s) => s.line))];
  const changedCount = classSkills.filter((s) => {
    const status = entityChangeStatus(s, patchOrder);
    return status.kind === "changed" && status.patch === currentPatch;
  }).length;

  const weaponGuildLines = [...new Set(skills.filter((s) => !s.className).map((s) => s.line))];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label id="skills-class-label">Class</Label>
          <Select value={cls} onValueChange={(v) => setCls(v as ClassName)}>
            <SelectTrigger className="w-48" aria-labelledby="skills-class-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_CLASSES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {capitalize(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sigil-ring size-8">
            <ClassSigil name={cls} className="size-4" />
          </span>
          {changedCount === 0
            ? `No changes this patch`
            : `${changedCount} skill${changedCount > 1 ? "s" : ""} changed in ${currentPatch}`}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {lines.map((line) => {
          const lineSkills = classSkills.filter((s) => s.line === line);
          return (
            <Card key={line}>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <EntitySigil src={skillLineArt(lineSkills[0])} size={22} />
                  {lineSkills[0].lineLabel}
                </CardTitle>
                <CardDescription>{capitalize(cls)} skill line</CardDescription>
              </CardHeader>
              <CardContent>
                {lineSkills.map((s) => (
                  <SkillRow key={s.id} s={s} patchOrder={patchOrder} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">Weapon &amp; guild lines</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Shared across every class. Expand a line to see its skills.
        </p>
        {/* Collapsed by default so the 21 shared lines don't bury the selected
            class's kit — the class selector above finally shortens the page. */}
        <div className="flex flex-col gap-2">
          {weaponGuildLines.map((line) => {
            const lineSkills = skills.filter((s) => !s.className && s.line === line);
            return (
              <details key={line} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium marker:text-muted-foreground">
                  <EntitySigil src={skillLineArt(lineSkills[0])} size={20} />
                  {lineSkills[0].lineLabel}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {lineSkills.length} skill{lineSkills.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="border-t border-border px-4 py-2">
                  {lineSkills.map((s) => (
                    <SkillRow key={s.id} s={s} patchOrder={patchOrder} />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
