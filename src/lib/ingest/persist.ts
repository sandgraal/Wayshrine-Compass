import { createClient } from "@supabase/supabase-js";
import type { PatchDataset } from "@/lib/types";
import type { IngestResult } from "./pipeline";

export function persistenceConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Writes a pipeline run to Supabase: patch row, entity provenance, build
 * flags, and an ingest_runs audit row. Requires the service-role key.
 */
export async function persistIngest(
  incoming: PatchDataset,
  result: IngestResult,
  fromPatch: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
