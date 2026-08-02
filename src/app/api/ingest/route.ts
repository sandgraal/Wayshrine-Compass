import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest/pipeline";
import { parsePatchDataset } from "@/lib/ingest/parse";
import { persistenceConfigured, persistIngest } from "@/lib/ingest/persist";
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
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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
  if (persistenceConfigured()) {
    await persistIngest(incoming, result, db.currentPatch);
    mode = "persisted";
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
