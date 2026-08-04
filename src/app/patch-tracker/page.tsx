import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { TRACKING_BASELINE_PATCH } from "@/lib/freshness";
import { RuneDivider } from "@/components/illustrations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PatchTrackerTable } from "./patch-tracker-table";

export const metadata: Metadata = { title: "Patch Tracker" };

export const revalidate = 300;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default async function PatchTrackerPage() {
  const db = await getDb();

  const rows = db.builds.map((build) => ({ build, freshness: db.freshness(build) }));

  // Equal provenance stamps mean the entity entered tracking that patch (the
  // baseline catalog import stamped 1,192 at once) — only lastChanged >
  // firstSeen is an observed change worth listing.
  const genuinelyChanged = (e: { firstSeenPatch: string; lastChangedPatch: string }, code: string) =>
    e.lastChangedPatch === code && e.lastChangedPatch !== e.firstSeenPatch;

  const patchHistory = [...db.patches].reverse().map((patch) => {
    const changed = [
      ...db.sets.filter((s) => genuinelyChanged(s, patch.code)).map((s) => ({ name: s.name, kind: "set" })),
      ...db.skills.filter((s) => genuinelyChanged(s, patch.code)).map((s) => ({ name: s.name, kind: "skill" })),
      ...db.cpStars.filter((s) => genuinelyChanged(s, patch.code)).map((s) => ({ name: s.name, kind: "CP star" })),
    ];
    const enteredTracking =
      db.sets.filter((s) => s.lastChangedPatch === patch.code && s.firstSeenPatch === s.lastChangedPatch).length +
      db.skills.filter((s) => s.lastChangedPatch === patch.code && s.firstSeenPatch === s.lastChangedPatch).length +
      db.cpStars.filter((s) => s.lastChangedPatch === patch.code && s.firstSeenPatch === s.lastChangedPatch).length;
    return { patch, changed, enteredTracking };
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
        {patchHistory.map(({ patch, changed, enteredTracking }) => (
          <Card key={patch.id} className={patch.code === db.currentPatch ? "border-primary/25" : undefined}>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{patch.code}</span>
                <span>{patch.name}</span>
              </CardTitle>
              <CardDescription>{DATE_FORMAT.format(new Date(patch.releasedAt))}</CardDescription>
            </CardHeader>
            <CardContent>
              {changed.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {changed.map((c) => (
                    <li key={`${c.kind}:${c.name}`}>
                      {c.name} <span className="text-xs">({c.kind})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No observed changes to tracked entities this update.</p>
              )}
              {enteredTracking > 0 && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {enteredTracking.toLocaleString("en-US")} entities entered tracking this update
                  {patch.code === TRACKING_BASELINE_PATCH ? " with the first full catalog import" : ""}.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
