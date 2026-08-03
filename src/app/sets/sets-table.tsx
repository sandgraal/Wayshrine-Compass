"use client";

import { useMemo, useState } from "react";
import type { GearSet } from "@/lib/types";
import type { Freshness } from "@/lib/freshness";
import { FreshnessBadge } from "@/components/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

/**
 * A set's freshness badge: verified unless it changed in the current patch,
 * in which case needs_review naming the set and patch. Mirrors the rule
 * db.freshness() applies to builds, evaluated directly against one entity.
 */
function setFreshness(set: GearSet, currentPatch: string): Freshness {
  if (set.lastChangedPatch !== currentPatch) {
    return { status: "verified", reasons: [], patchVerified: currentPatch, patchesBehind: 0 };
  }
  return {
    status: "needs_review",
    reasons: [
      {
        entityType: "set",
        entityId: set.id,
        entityName: set.name,
        patch: currentPatch,
        summary: `${set.name} changed in ${currentPatch}.`,
      },
    ],
    patchVerified: currentPatch,
    patchesBehind: 0,
  };
}

export function SetsTable({ sets, currentPatch }: { sets: GearSet[]; currentPatch: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const types = useMemo(() => [...new Set(sets.map((s) => s.type))].sort(), [sets]);

  const filtered = sets.filter(
    (s) => (type === "all" || s.type === type) && s.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="set-search">Search</Label>
          <Input
            id="set-search"
            className="w-56"
            placeholder="Set name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {sets.length} sets
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Set</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Freshness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} id={s.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {s.name}
                    {s.mythicSlot && <Badge variant="outline">Mythic</Badge>}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {s.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.bonuses[s.bonuses.length - 1]?.effect}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.source}</TableCell>
                <TableCell>
                  <FreshnessBadge freshness={setFreshness(s, currentPatch)} currentPatch={currentPatch} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No sets match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
