import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { FreshnessBadge } from "@/components/freshness-badge";

export const metadata: Metadata = { title: "Review Queue" };

/**
 * Admin queue (Phase 1): every build the diff engine flagged, with the exact
 * entities that changed. In Supabase mode this reads status=needs_review rows
 * written by the ingestion job; in seed mode freshness is computed on read.
 */
export const revalidate = 300;

export default async function ReviewQueuePage() {
  const db = await getDb();
  const queue = db.builds
    .map((b) => ({ build: b, freshness: db.freshness(b) }))
    .filter(({ freshness }) => freshness.status !== "verified")
    .sort((a, b) => (a.freshness.status === "stale" ? -1 : 1) - (b.freshness.status === "stale" ? -1 : 1));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Review queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Builds flagged by the ingestion pipeline. Reviewing a build re-stamps its{" "}
        <code className="font-mono text-xs">patch_verified</code> to {db.currentPatch}.
      </p>

      {queue.length === 0 ? (
        <p className="mt-8 rounded-lg border border-verified/40 bg-verified/10 p-4 text-sm text-verified">
          Queue is empty — every build is verified for {db.currentPatch}.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {queue.map(({ build, freshness }) => (
            <li key={build.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/builds/${build.slug}`} className="font-semibold underline-offset-4 hover:underline">
                  {build.name}
                </Link>
                <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
              </div>
              {freshness.reasons.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {freshness.reasons.map((r) => (
                    <li key={`${r.entityType}:${r.entityId}`}>
                      <span className="font-mono text-needs-review">{r.entityType}</span> {r.summary}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last verified {freshness.patchVerified} — {freshness.patchesBehind} patches behind.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
