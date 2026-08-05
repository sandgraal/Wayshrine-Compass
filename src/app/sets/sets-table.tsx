"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GearSet, PatchCode } from "@/lib/types";
import { dlcLabel } from "@/data/zones";
import { EntityChangeBadge } from "@/components/entity-change-badge";
import { EntitySigil } from "@/components/entity-sigil";
import { setTypeArt } from "@/lib/entity-art";
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

type SortKey = "name" | "type" | "dlc";

/** Rows rendered per window; grown as the sentinel scrolls into view. 641 rows
 * at once was a 2 MB page. */
const PAGE = 60;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "dlc", label: "DLC" },
];

function byName(a: GearSet, b: GearSet) {
  return a.name.localeCompare(b.name);
}

export function SetsTable({
  sets,
  patchOrder,
}: {
  sets: GearSet[];
  patchOrder: PatchCode[];
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [limit, setLimit] = useState(PAGE);
  const [hashTargetId, setHashTargetId] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(sets.map((s) => s.type))].sort(), [sets]);

  const filtered = useMemo(() => {
    const list = sets.filter(
      (s) => (type === "all" || s.type === type) && s.name.toLowerCase().includes(q.toLowerCase())
    );
    const cmp: Record<SortKey, (a: GearSet, b: GearSet) => number> = {
      name: byName,
      type: (a, b) => a.type.localeCompare(b.type) || byName(a, b),
      dlc: (a, b) => dlcLabel(a.dlcRequired).localeCompare(dlcLabel(b.dlcRequired)) || byName(a, b),
    };
    return [...list].sort(cmp[sort]);
  }, [sets, q, type, sort]);

  // Reset the window when the view changes (filter/sort edit). Adjusting state
  // during render — not in an effect — so it doesn't trip set-state-in-effect
  // and takes effect on the same render.
  const viewKey = `${q}|${type}|${sort}`;
  const [prevViewKey, setPrevViewKey] = useState(viewKey);
  if (viewKey !== prevViewKey) {
    setPrevViewKey(viewKey);
    setLimit(PAGE);
  }

  // A deep-linked row must render even past the current window, so the window
  // always widens to include the hash target (its index in the active order).
  const targetIndex = hashTargetId ? filtered.findIndex((s) => s.id === hashTargetId) : -1;
  const effectiveLimit = targetIndex >= 0 ? Math.max(limit, targetIndex + 5) : limit;
  const visible = filtered.slice(0, effectiveLimit);
  const hasMore = visible.length < filtered.length;

  // Grow the window as the sentinel nears the viewport. setLimit runs in the
  // observer callback, not synchronously in the effect body.
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((n) => n + PAGE);
      },
      { rootMargin: "800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  // Deep links (/sets#<set-id>, e.g. from a build page): clear any active
  // filter so the row isn't hidden and mark it as the window target. Initial
  // navigation is deferred so state updates do not run in the effect body.
  useEffect(() => {
    const goToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id || !sets.some((s) => s.id === id)) return;
      setQ("");
      setType("all");
      setSort("name");
      setHashTargetId(id);
    };
    const initial = setTimeout(goToHash, 0);
    window.addEventListener("hashchange", goToHash);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("hashchange", goToHash);
    };
  }, [sets]);

  useEffect(() => {
    if (!hashTargetId) return;
    document.getElementById(hashTargetId)?.scrollIntoView({ block: "center" });
  }, [hashTargetId]);

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
        <div className="flex flex-col gap-1.5">
          <Label id="set-sort-label">Sort by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-36" aria-labelledby="set-sort-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
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
              <TableHead>DLC</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last changed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((s) => (
              <TableRow key={s.id} id={s.id} className="scroll-mt-24">
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <EntitySigil src={setTypeArt(s)} />
                    {s.name}
                    {s.mythicSlot && <Badge variant="outline">Mythic</Badge>}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {s.type}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {dlcLabel(s.dlcRequired)}
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
            {hasMore && (
              <TableRow ref={sentinelRef}>
                <TableCell colSpan={6} className="py-4 text-center text-xs text-muted-foreground">
                  Loading more… ({visible.length} of {filtered.length})
                </TableCell>
              </TableRow>
            )}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
