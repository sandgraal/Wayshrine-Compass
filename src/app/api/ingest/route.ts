import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest/pipeline";
import { parsePatchDataset } from "@/lib/ingest/parse";
import { canPersist, persistenceConfigured, persistIngest } from "@/lib/ingest/persist";
import { getDb } from "@/lib/data";

/**
 * Manual ingestion endpoint. POST a PatchDataset with
 * `Authorization: Bearer $INGEST_SECRET`. The scheduled path lives at
 * /api/cron/ingest and fetches its dataset from DATASET_URL.
 *
 * The diff pipeline always runs and its report is returned. Persistence
 * requires SUPABASE_SERVICE_ROLE_KEY (see supabase/README.md); without it
 * the run is a dry run.
 */
export async function POST(request: Request) {
  // Fail closed: without a configured secret this endpoint accepts nothing.
  // A missing secret must never mean "open to everyone" on a route that can
  // perform service-role writes.
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INGEST_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const incoming = parsePatchDataset(body);
  if (!incoming) {
    return NextResponse.json({ error: "body must be a PatchDataset" }, { status: 400 });
  }

  const db = await getDb();
  const result = runIngest(
    { sets: db.sets, skills: db.skills, cpStars: db.cpStars },
    db.currentPatch,
    incoming,
    db.builds
  );

  let mode = "dry-run";
  if (canPersist(db)) {
    await persistIngest(incoming, result, db.currentPatch);
    mode = "persisted";
  } else if (persistenceConfigured()) {
    // Service key present but the read fell back to seed data — persisting a
    // seed-based diff would overwrite live provenance, so refuse.
    mode = "dry-run (read source is seed; refusing to persist)";
  }

  return NextResponse.json({
    mode,
    report: result.report,
    flaggedBuilds: result.flagged.map((b) => ({
      id: b.id,
      slug: b.slug,
      reasons: b.needsReviewReasons.map((r) => r.summary),
    })),
  });
}

export async function GET() {
  const db = await getDb();
  return NextResponse.json({
    currentPatch: db.currentPatch,
    source: db.source,
    entities: { sets: db.sets.length, skills: db.skills.length, cpStars: db.cpStars.length },
    builds: db.builds.length,
  });
}
