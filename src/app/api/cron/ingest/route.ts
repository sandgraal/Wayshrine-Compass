import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest/pipeline";
import { parsePatchDataset } from "@/lib/ingest/parse";
import { persistenceConfigured, persistIngest } from "@/lib/ingest/persist";
import { getDb } from "@/lib/data";

/**
 * Scheduled ingestion (vercel.json cron, daily). Fetches the current patch
 * dataset from DATASET_URL — any HTTPS endpoint returning a PatchDataset,
 * e.g. a community data-dump export job — runs the diff pipeline against the
 * live store, and persists provenance + build flags when the service-role key
 * is configured.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set;
 * the check below rejects everything else so the endpoint can't be triggered
 * by outsiders.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const datasetUrl = process.env.DATASET_URL;
  if (!datasetUrl) {
    return NextResponse.json({
      skipped: "DATASET_URL not configured — no patch dataset source to poll yet",
    });
  }

  let payload: unknown;
  try {
    const res = await fetch(datasetUrl, { headers: { accept: "application/json" } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `dataset fetch failed: HTTP ${res.status}` },
        { status: 502 }
      );
    }
    payload = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: `dataset fetch failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const incoming = parsePatchDataset(payload);
  if (!incoming) {
    return NextResponse.json({ error: "dataset is not a valid PatchDataset" }, { status: 502 });
  }

  const db = await getDb();

  // Same-patch refetches are normal (the dump updates in place); the diff
  // engine returns an empty report when nothing actually changed.
  const result = runIngest(
    { sets: db.sets, skills: db.skills, cpStars: db.cpStars },
    db.currentPatch,
    incoming,
    db.builds
  );

  let mode = "dry-run";
  if (persistenceConfigured()) {
    await persistIngest(incoming, result, db.currentPatch);
    mode = "persisted";
  }

  return NextResponse.json({
    mode,
    fromPatch: db.currentPatch,
    toPatch: incoming.patch.code,
    changes: result.report.changes.length,
    flaggedBuilds: result.flagged.map((b) => b.slug),
  });
}
