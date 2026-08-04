import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import {
  fetchRecentIngestRuns,
  persistenceConfigured,
  type IngestRunSummary,
} from "@/lib/ingest/persist";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/**
 * Admin hub: pipeline health at a glance — current patch, active data source,
 * review-queue counts, and the ingest audit trail (ingest_runs is service-role
 * read only, so this is the one place it's surfaced). Read-only; the only
 * admin action lives in /admin/review behind ADMIN_SECRET.
 */
export const dynamic = "force-dynamic";

export default async function AdminHubPage() {
  // Normal cached read: this page is read-only and publicly linked, so it
  // must not turn crawler traffic into full-table Supabase fetches. Only the
  // review console (which acts on what it shows) bypasses the cache.
  const db = await getDb();

  const counts = { verified: 0, needs_review: 0, stale: 0 };
  for (const build of db.builds) counts[db.freshness(build).status] += 1;

  let runs: IngestRunSummary[] | null = null;
  if (persistenceConfigured() && db.source === "supabase") {
    try {
      runs = await fetchRecentIngestRuns();
    } catch {
      runs = null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pipeline status and admin actions. Everything here is read-only except the review queue,
        which requires the admin token.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Current patch</dt>
          <dd className="mt-1 text-lg font-semibold">{db.currentPatch}</dd>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Data source</dt>
          <dd className="mt-1 text-lg font-semibold">{db.source}</dd>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Needs review</dt>
          <dd className="mt-1 text-lg font-semibold text-needs-review">{counts.needs_review}</dd>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Stale</dt>
          <dd className="mt-1 text-lg font-semibold text-stale">{counts.stale}</dd>
        </div>
      </dl>

      <Link
        href="/admin/review"
        className="mt-4 inline-block rounded-md border border-border bg-card px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        Open review queue ({counts.needs_review + counts.stale} of {db.builds.length} builds)
      </Link>

      <h2 className="mt-10 text-lg font-semibold">Recent ingest runs</h2>
      {runs === null ? (
        <p className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Ingest history unavailable — it requires the live database (current source:{" "}
          {db.source}).
        </p>
      ) : runs.length === 0 ? (
        <p className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No ingest runs recorded yet.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Ran at (UTC)</th>
                <th className="px-4 py-2 font-medium">Patch</th>
                <th className="px-4 py-2 font-medium">Changes</th>
                <th className="px-4 py-2 font-medium">Builds flagged</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">
                    {run.ranAt.replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-4 py-2">
                    {run.fromPatch === run.toPatch
                      ? run.toPatch
                      : `${run.fromPatch ?? "?"} → ${run.toPatch ?? "?"}`}
                  </td>
                  <td className="px-4 py-2">{run.changes}</td>
                  <td className="px-4 py-2">{run.flaggedBuilds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
