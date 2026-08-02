import { NextResponse } from "next/server";
import type { PatchDataset } from "@/lib/types";
import { runIngest } from "@/lib/ingest/pipeline";
import { db } from "@/lib/data";

/**
 * Ingestion endpoint. Scheduled via Vercel cron (see vercel.json) and also
 * callable manually with a patch dataset payload for testing:
 *
 *   POST /api/ingest  { patch: {...}, sets: [...], skills: [...], cpStars: [...] }
 *
 * This is currently a dry run: it returns the diff report and the builds that
 * would be flagged, without persisting. supabase/README.md documents the
 * pending persistence steps (entity upserts + build status updates).
 */
export async function POST(request: Request) {
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let incoming: PatchDataset;
  try {
    incoming = (await request.json()) as PatchDataset;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!incoming?.patch?.code || !Array.isArray(incoming.sets)) {
    return NextResponse.json({ error: "body must be a PatchDataset" }, { status: 400 });
  }

  const result = runIngest(
    { sets: db.sets, skills: db.skills, cpStars: db.cpStars },
    db.currentPatch,
    incoming,
    db.builds
  );

  return NextResponse.json({
    mode: "dry-run (seed data)",
    report: result.report,
    flaggedBuilds: result.flagged.map((b) => ({
      id: b.id,
      slug: b.slug,
      reasons: b.needsReviewReasons.map((r) => r.summary),
    })),
  });
}

export async function GET() {
  return NextResponse.json({
    currentPatch: db.currentPatch,
    entities: { sets: db.sets.length, skills: db.skills.length, cpStars: db.cpStars.length },
    builds: db.builds.length,
  });
}
