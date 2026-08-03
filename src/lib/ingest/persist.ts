import { createClient } from "@supabase/supabase-js";
import type { PatchDataset } from "@/lib/types";
import type { Db } from "@/lib/data/core";
import type { IngestResult } from "./pipeline";

/**
 * Persistence is only safe when BOTH hold:
 * - the service-role key is configured (we can write), and
 * - the store we diffed against actually came from Supabase — if the read
 *   path fell back to seed data (missing key, outage), persisting that diff
 *   would overwrite correct live provenance with seed-derived state.
 */
export function canPersist(db: Pick<Db, "source">): boolean {
  return (
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    db.source === "supabase"
  );
}

/** True when a service-role key exists (used for fail-closed auth checks). */
export function persistenceConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Applies a pipeline run to Supabase through the ingest_apply database
 * function (supabase/migrations/0002_ingest_apply.sql), so the patch row,
 * entity upserts, removal reconciliation, build flags, and audit row commit
 * or roll back as one transaction.
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

  const payload = {
    from_patch: fromPatch,
    patch: {
      id: incoming.patch.id,
      code: incoming.patch.code,
      name: incoming.patch.name,
      released_at: incoming.patch.releasedAt,
      season: incoming.patch.season,
    },
    sets: result.store.sets.map((s) => ({
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
    skills: result.store.skills.map((s) => ({
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
    cp_stars: result.store.cpStars.map((s) => ({
      id: s.id,
      tree: s.tree,
      name: s.name,
      effect: { text: s.effect },
      slottable: s.slottable,
      last_changed_patch: s.lastChangedPatch,
    })),
    flagged: result.flagged.map((b) => ({ id: b.id, reasons: b.needsReviewReasons })),
    report: result.report,
  };

  const { error } = await supabase.rpc("ingest_apply", { payload });
  if (error) throw new Error(`ingest_apply failed (transaction rolled back): ${error.message}`);
}

/**
 * Re-stamps a build after a human review: patch_verified moves to the given
 * patch and the ingest-written flags are cleared. Touches only the build's own
 * row — freshness stays computed from entity provenance on read, so a build
 * whose references change again immediately goes back to amber.
 */
export async function markBuildReviewed(buildId: string, patch: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("builds")
    .update({ status: "verified", patch_verified: patch, review_reasons: [] })
    .eq("id", buildId)
    .select("id");
  if (error) throw new Error(`mark reviewed failed: ${error.message}`);
  if (!data || data.length === 0) throw new Error(`mark reviewed failed: build ${buildId} not found`);
}
