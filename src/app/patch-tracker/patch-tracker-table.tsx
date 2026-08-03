"use client";

import { useState } from "react";
import Link from "next/link";
import type { Build, Role } from "@/lib/types";
import type { Freshness } from "@/lib/freshness";
import { FreshnessBadge } from "@/components/freshness-badge";
import { ClassSigil } from "@/components/illustrations";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Row {
  build: Build;
  freshness: Freshness;
}

const ROLES: Role[] = ["dps", "tank", "healer"];
const STATUSES: Freshness["status"][] = ["verified", "needs_review", "stale"];

export function PatchTrackerTable({ rows, currentPatch }: { rows: Row[]; currentPatch: string }) {
  const [role, setRole] = useState<Role | "all">("all");
  const [fresh, setFresh] = useState<Freshness["status"] | "all">("all");

  const filtered = rows.filter(
    ({ build, freshness }) =>
      (role === "all" || build.role === role) && (fresh === "all" || freshness.status === fresh)
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Freshness</Label>
          <Select value={fresh} onValueChange={(v) => setFresh(v as Freshness["status"] | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Any freshness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any freshness</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "needs_review" ? "Needs review" : s === "verified" ? "Verified" : "Stale"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {rows.length} builds
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Build</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Freshness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ build, freshness }) => (
              <TableRow key={build.id}>
                <TableCell>
                  <span className="flex items-center gap-2 capitalize">
                    <ClassSigil name={build.className} className="size-4 text-primary" />
                    {build.className}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/builds/${build.slug}`} className="text-foreground no-underline hover:text-primary">
                    {build.name}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{build.role}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{build.contentType}</TableCell>
                <TableCell>
                  <FreshnessBadge freshness={freshness} currentPatch={currentPatch} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No builds match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
