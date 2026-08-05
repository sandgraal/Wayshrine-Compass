"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_CLASSES, type ClassName, type PatchCode, type Skill } from "@/lib/types";
import { entityChangeStatus } from "@/lib/freshness";
import { EntityChangeBadge } from "@/components/entity-change-badge";
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
      <p className="text-sm text-muted-foreground">{s.description}</p>
      <p className="text-xs text-muted-foreground">{s.morphs.map((m) => m.name).join(" · ")}</p>
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
  // target's class first, then scroll once that render commits.
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = skills.find((s) => s.id === id);
      if (!target) return;
      if (target.className) setCls(target.className);
      setPendingHash(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [skills]);
  // One-shot guard: scroll to a given hash once (across the class-switch
  // re-render), tracked in a ref so the effect never has to call setState.
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingHash || scrolledFor.current === pendingHash) return;
    const el = document.getElementById(pendingHash);
    if (el) {
      el.scrollIntoView({ block: "center" });
      scrolledFor.current = pendingHash;
    }
  }, [pendingHash, cls]);

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
                <CardTitle>{lineSkills[0].lineLabel}</CardTitle>
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
        <h2 className="mb-3 text-lg font-semibold">Weapon &amp; guild lines</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {weaponGuildLines.map((line) => {
            const lineSkills = skills.filter((s) => !s.className && s.line === line);
            return (
              <Card key={line}>
                <CardHeader className="border-b border-border">
                  <CardTitle>{lineSkills[0].lineLabel}</CardTitle>
                  <CardDescription>Weapon &amp; guild skill line</CardDescription>
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
      </div>
    </div>
  );
}
