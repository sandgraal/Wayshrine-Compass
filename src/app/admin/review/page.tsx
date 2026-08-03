import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { ReviewConsole, type ReviewItem } from "./review-console";

export const metadata: Metadata = { title: "Review Queue" };

/**
 * Admin console: every build with its computed freshness and the exact amber
 * reasons, plus a "mark reviewed" action that re-stamps patch_verified via
 * POST /api/admin/review. Rendered dynamically — an admin deciding whether a
 * build is safe to re-stamp must never act on a cached queue.
 */
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const db = await getDb();
  const items: ReviewItem[] = db.builds
    .map((b) => ({ id: b.id, slug: b.slug, name: b.name, freshness: db.freshness(b) }))
    .sort((a, b) => {
      const rank = { stale: 0, needs_review: 1, verified: 2 } as const;
      return rank[a.freshness.status] - rank[b.freshness.status] || a.name.localeCompare(b.name);
    });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Review queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Builds flagged by the ingestion pipeline. Marking a build reviewed re-stamps its{" "}
        <code className="font-mono text-xs">patch_verified</code> to {db.currentPatch} after you have
        re-checked it against the listed changes. Data source: {db.source}.
      </p>
      <ReviewConsole items={items} currentPatch={db.currentPatch} />
    </div>
  );
}
