import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/data";
import { TRACKING_BASELINE_PATCH } from "@/lib/freshness";
import { buildChangelog, changeHref, type ChangelogRun } from "@/lib/changelog";
import { fetchIngestRunReports, persistenceConfigured } from "@/lib/ingest/persist";
import { RuneDivider } from "@/components/illustrations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Patch Tracker",
  description:
    "See what each ESO update actually changed: a per-run diff of tracked sets, skills, and CP stars from the data pipeline.",
};

export const revalidate = 300;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const RUN_DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

const KIND_LABEL: Record<string, string> = {
  changed: "Changed",
  renamed: "Renamed",
  removed: "Removed",
  added: "Added",
};

const TYPE_LABEL: Record<string, string> = {
  set: "sets",
  skill: "skills",
  cp_star: "CP stars",
  grimoire: "grimoires",
  script: "scripts",
  mastery_line: "mastery lines",
};

export default async function PatchTrackerPage() {
  const db = await getDb();

  const totalEntities =
    db.sets.length +
    db.skills.length +
    db.cpStars.length +
    db.grimoires.length +
    db.scripts.length +
    db.classMasteryLines.length;

  const reviewCounts = { verified: 0, needs_review: 0, stale: 0 };
  for (const build of db.builds) reviewCounts[db.freshness(build).status] += 1;

  // The run feed reads the persisted audit trail, which has no public read
  // policy — it needs the service-role credential on top of a live read
  // source. The provenance summary below renders either way.
  let runs: ChangelogRun[] = [];
  let feedUnavailable: string | null = null;
  if (db.source !== "supabase") {
    feedUnavailable = "Run history requires the live database; this deployment is serving the seed dataset.";
  } else if (!persistenceConfigured()) {
    feedUnavailable = "Run history requires the operator credential, which this environment does not have.";
  } else {
    try {
      runs = buildChangelog(await fetchIngestRunReports(15));
    } catch {
      feedUnavailable = "The run history could not be read just now.";
    }
  }

  const lastRun = runs[0];

  // Equal provenance stamps mean the entity entered tracking that patch (the
  // baseline catalog import stamped 1,089 at once) — only lastChanged >
  // firstSeen is an observed change worth listing.
  const genuinelyChanged = (e: { firstSeenPatch: string; lastChangedPatch: string }, code: string) =>
    e.lastChangedPatch === code && e.lastChangedPatch !== e.firstSeenPatch;

  // All six tracked collections — omitting the newer types here would let a
  // grimoire/script/mastery change render as "no observed changes".
  const collections: [{ id: string; name: string; firstSeenPatch: string; lastChangedPatch: string }[], string][] = [
    [db.sets, "set"],
    [db.skills, "skill"],
    [db.cpStars, "CP star"],
    [db.grimoires, "grimoire"],
    [db.scripts, "script"],
    [db.classMasteryLines, "mastery line"],
  ];

  const patchHistory = [...db.patches].reverse().map((patch) => {
    const changed = collections.flatMap(([rows, kind]) =>
      rows.filter((e) => genuinelyChanged(e, patch.code)).map((e) => ({ id: e.id, name: e.name, kind }))
    );
    const enteredTracking = collections.reduce(
      (sum, [rows]) =>
        sum +
        rows.filter((e) => e.lastChangedPatch === patch.code && e.firstSeenPatch === e.lastChangedPatch).length,
      0
    );
    return { patch, changed, enteredTracking };
  });

  return (
    <div>
      <span className="font-mono text-xs text-primary">PATCH TRACKER</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        What the {db.currentPatch} data pipeline actually observed
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        The pipeline tracks {totalEntities.toLocaleString("en-US")} entities: sets, skills, CP
        stars, grimoires, scripts, and class mastery lines. Every run below is a persisted audit
        row; a quiet run is reported as quiet, not relabeled as an update.
      </p>
      {lastRun && (
        <p className="mt-2 text-sm">
          Latest run{" "}
          <span className="font-mono text-xs">{RUN_DATE_FORMAT.format(new Date(lastRun.ranAt))} UTC</span>:{" "}
          {lastRun.totalChanges === 0
            ? "no changes observed."
            : `${lastRun.totalChanges.toLocaleString("en-US")} ${lastRun.totalChanges === 1 ? "change" : "changes"} observed.`}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {(
          [
            ["verified", "Verified", "text-verified"],
            ["needs_review", "Needs review", "text-needs-review"],
            ["stale", "Stale", "text-stale"],
          ] as const
        ).map(([key, label, tone]) => (
          <Link
            key={key}
            href={`/builds?freshness=${key}`}
            className="flex min-w-28 flex-col rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent"
          >
            <span className={`text-2xl font-bold ${tone}`}>{reviewCounts[key]}</span>
            <span className="text-xs text-muted-foreground">{label} builds</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 mb-6 flex flex-col gap-2">
        <span className="font-mono text-xs text-primary">RUN FEED</span>
        <h2 className="text-2xl font-bold">Recent pipeline runs, with their diffs</h2>
      </div>

      {feedUnavailable ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {feedUnavailable} The per-update provenance summary below still applies.
        </p>
      ) : runs.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No ingest runs recorded yet. The next scheduled run will appear here with its full diff.
        </p>
      ) : (
        <ol className="space-y-4">
          {runs.map((run) => (
            <li key={run.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {RUN_DATE_FORMAT.format(new Date(run.ranAt))} UTC
                </span>
                <span className="text-sm font-medium">
                  {run.fromPatch && run.toPatch && run.fromPatch !== run.toPatch
                    ? `${run.fromPatch} to ${run.toPatch}`
                    : run.toPatch ?? ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {run.totalChanges === 0
                    ? "no changes"
                    : `${run.totalChanges.toLocaleString("en-US")} ${run.totalChanges === 1 ? "change" : "changes"}`}
                  {run.flaggedBuilds > 0 &&
                    ` · ${run.flaggedBuilds} ${run.flaggedBuilds === 1 ? "build" : "builds"} flagged`}
                </span>
              </div>

              {run.collapsedAdditions !== null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Catalog import: {run.collapsedAdditions.toLocaleString("en-US")} entities entered
                  tracking in this run.
                </p>
              )}

              {run.groups.map((group) => (
                <div key={`${group.kind}:${group.entityType}`} className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {KIND_LABEL[group.kind] ?? group.kind} · {TYPE_LABEL[group.entityType] ?? group.entityType} (
                    {group.items.length})
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-sm">
                    {group.items.map((item) => {
const href = changeHref(item.entityType, item.renamedTo?.entityId ?? item.entityId);
                      return (
                        <li key={`${item.entityType}:${item.entityId}`}>
                          {href ? (
                            <Link href={href} className="font-medium underline-offset-2 hover:underline">
                              {item.entityName}
                            </Link>
                          ) : (
                            <span className="font-medium">{item.entityName}</span>
                          )}
                          {item.kind === "renamed" && item.renamedTo && (
                            <span className="text-muted-foreground"> now {item.renamedTo.entityName}</span>
                          )}
{(item.kind === "changed" || item.kind === "renamed") &&
  item.changedFields.length > 0 &&
  (item.fieldDiffs && item.fieldDiffs.length > 0 ? (
    <span className="mt-0.5 block text-xs text-muted-foreground">
      {item.fieldDiffs.map((d) => (
        <span key={d.field} className="mr-3 inline-block">
          <span className="font-mono">{d.field}</span>: {d.before}{" "}
          <span aria-hidden>&rarr;</span> {d.after}
        </span>
      ))}
    </span>
  ) : (
    <span className="text-muted-foreground"> ({item.changedFields.join(", ")})</span>
  ))}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ol>
      )}

      <div className="py-16">
        <RuneDivider />
      </div>

      <div className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs text-primary">PATCH HISTORY</span>
        <h2 className="text-2xl font-bold">Observed changes, update by update</h2>
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
                    <li key={`${c.kind}:${c.id}`}>
                      {c.kind === "set" ? (
                        <Link href={`/sets#${c.id}`} className="underline-offset-2 hover:underline">
                          {c.name}
                        </Link>
                      ) : c.kind === "skill" ? (
                        <Link href={`/skills#${c.id}`} className="underline-offset-2 hover:underline">
                          {c.name}
                        </Link>
                      ) : (
                        c.name
                      )}{" "}
                      <span className="text-xs">({c.kind})</span>
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
