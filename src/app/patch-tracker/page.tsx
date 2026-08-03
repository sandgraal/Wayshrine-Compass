import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { RuneDivider } from "@/components/illustrations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PatchTrackerTable } from "./patch-tracker-table";

export const metadata: Metadata = { title: "Patch Tracker" };

export const revalidate = 300;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default async function PatchTrackerPage() {
  const db = await getDb();

  const rows = db.builds.map((build) => ({ build, freshness: db.freshness(build) }));

  const patchHistory = [...db.patches].reverse().map((patch) => {
    const verifiedThisPatch = db.builds.filter((b) => b.patchVerified === patch.code).length;
    const changed = [
      ...db.sets.filter((s) => s.lastChangedPatch === patch.code).map((s) => s.name),
      ...db.skills.filter((s) => s.lastChangedPatch === patch.code).map((s) => s.name),
      ...db.cpStars.filter((s) => s.lastChangedPatch === patch.code).map((s) => s.name),
    ];
    return { patch, verifiedThisPatch, changed };
  });

  return (
    <div>
      <span className="font-mono text-xs text-primary">PATCH TRACKER</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        Every tracked build, checked against {db.currentPatch}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Filter by role or freshness to find builds that need a second look, or browse the patch
        history below to see what changed and when.
      </p>

      <div className="mt-6">
        <PatchTrackerTable rows={rows} currentPatch={db.currentPatch} />
      </div>

      <div className="py-16">
        <RuneDivider />
      </div>

      <div className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs text-primary">PATCH HISTORY</span>
        <h2 className="text-2xl font-bold">What changed, update by update</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {patchHistory.map(({ patch, verifiedThisPatch, changed }) => (
          <Card key={patch.id} className={patch.code === db.currentPatch ? "border-primary/25" : undefined}>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{patch.code}</span>
                <span className="text-muted-foreground">&mdash;</span>
                <span>{patch.name}</span>
              </CardTitle>
              <CardDescription>
                {DATE_FORMAT.format(new Date(patch.releasedAt))} &middot; {verifiedThisPatch}{" "}
                {verifiedThisPatch === 1 ? "build" : "builds"} last reviewed this update
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changed.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {changed.map((name) => (
                    <li key={name}>{name} &mdash; changed</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No tracked entities changed this update.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
