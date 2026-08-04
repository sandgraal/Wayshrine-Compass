"use client";

import { useMemo, useState } from "react";
import type { GearSet, PatchCode } from "@/lib/types";
import { EntityChangeBadge } from "@/components/entity-change-badge";
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

export function SetsTable({
  sets,
  patchOrder,
}: {
  sets: GearSet[];
  patchOrder: PatchCode[];
}) {
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
          <Label id="set-type-label">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44" aria-labelledby="set-type-label">
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
              <TableHead>Last changed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} id={s.id} className="scroll-mt-24">
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
                <TableCell className="whitespace-normal text-muted-foreground">
                  <ul className="flex flex-col gap-0.5">
                    {s.bonuses.map((b) => (
                      <li key={b.pieces}>
                        <span className="font-mono text-foreground">{b.pieces}pc</span> {b.effect}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.source}</TableCell>
                <TableCell>
                  <EntityChangeBadge entity={s} patchOrder={patchOrder} />
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
