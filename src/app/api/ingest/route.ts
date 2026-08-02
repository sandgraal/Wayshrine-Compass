import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PatchDataset } from "@/lib/types";
import { runIngest, type IngestResult } from "@/lib/ingest/pipeline";
import { getDb } from "@/lib/data";

/**
 * Ingestion endpoint. Callable manually (and by a scheduled job) with a patch
 * dataset payload:
 *
 *   POST /api/ingest  { patch: {...}, sets: [...], skills: [...], cpStars: [...] }
 *   Authorization: Bearer $INGEST_SECRET
 *
 * The diff pipeline always runs and its report is returned. Persistence
 * requires SUPABASE_SERVICE_ROLE_KEY in the environment (see
 * supabase/README.md); without it the run is a dry run.
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

  const db = await getDb();
  const result = runIngest(
    { sets: db.sets, skills: db.skills, cpStars: db.cpStars },
    db.currentPatch,
    incoming,
    db.builds
  );

  let mode = "dry-run";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && url) {
    await persist(url, serviceKey, incoming, result, db.currentPatch);
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

/** Writes the pipeline output to Supabase: provenance, flags, audit row. */
async function persist(
  url: string,
  serviceKey: string,
  incoming: PatchDataset,
  result: IngestResult,
  fromPatch: string
) {
  const supabase = createClient(url, serviceKey);
  const fail = (table: string, message: string) => {
    throw new Error(`persist ${table}: ${message}`);
  };

  const { error: patchErr } = await supabase.from("patches").upsert(
    {
      id: incoming.patch.id,
      code: incoming.patch.code,
      name: incoming.patch.name,
      released_at: incoming.patch.releasedAt || null,
      season: incoming.patch.season,
    },
    { onConflict: "id" }
  );
  if (patchErr) fail("patches", patchErr.message);

  const { error: setsErr } = await supabase.from("sets").upsert(
    result.store.sets.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      source: s.source,
      dlc_required: s.dlcRequired,
      bonuses: s.bonuses,
      mythic_slot: s.mythicSlot ?? null,
      first_seen_patch: s.firstSeenPatch,
      last_changed_patch: s.lastChangedPatch,
    })),
    { onConflict: "id" }
  );
  if (setsErr) fail("sets", setsErr.message);

  const { error: skillsErr } = await supabase.from("skills").upsert(
    result.store.skills.map((s) => ({
      id: s.id,
      class: s.className,
      line: s.line,
      line_label: s.lineLabel,
      name: s.name,
      ultimate: s.ultimate,
      description: s.description,
      morphs: s.morphs,
      first_seen_patch: s.firstSeenPatch,
      last_changed_patch: s.lastChangedPatch,
    })),
    { onConflict: "id" }
  );
  if (skillsErr) fail("skills", skillsErr.message);

  const { error: cpErr } = await supabase.from("cp_stars").upsert(
    result.store.cpStars.map((s) => ({
      id: s.id,
      tree: s.tree,
      name: s.name,
      effect: { text: s.effect },
      slottable: s.slottable,
      last_changed_patch: s.lastChangedPatch,
    })),
    { onConflict: "id" }
  );
  if (cpErr) fail("cp_stars", cpErr.message);

  for (const build of result.flagged) {
    const { error } = await supabase
      .from("builds")
      .update({ status: "needs_review", review_reasons: build.needsReviewReasons })
      .eq("id", build.id);
    if (error) fail("builds", error.message);
  }

  const { error: runErr } = await supabase.from("ingest_runs").insert({
    from_patch: fromPatch,
    to_patch: incoming.patch.code,
    report: result.report,
    flagged: result.flagged.map((b) => ({ id: b.id, reasons: b.needsReviewReasons })),
  });
  if (runErr) fail("ingest_runs", runErr.message);
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
