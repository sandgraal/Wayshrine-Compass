/**
 * Pushes ONLY the builds + build_entities join to Supabase.
 *
 * Unlike scripts/seed-supabase.ts (a full first-time seed), this script never
 * touches the entity tables (sets, skills, cp_stars, mundus_stones, foods,
 * companions, zones, patches). Those are owned by the ingest pipeline against
 * the live U50 dataset — reseeding them from the smaller committed seed slice
 * would clobber live data. Run this after editing src/data/builds.ts.
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/seed-builds.ts
 *
 * Non-destructive to entity tables. New builds are inserted with their seed
 * trust metadata (status / patch_verified / review_reasons); EXISTING builds
 * are updated content-only, so a manual /admin verification or ingest review
 * reasons already on the row are preserved — this sync never resets a build's
 * trust state. For build_entities it deletes and reinserts the join rows of
 * exactly the builds it writes, so a renamed/removed reference never leaves a
 * stale join row behind.
 */
import { createClient } from "@supabase/supabase-js";
import { builds } from "../src/data/builds";
import { buildEntityRefs } from "../src/lib/entities";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

/** Structural columns — safe to overwrite; never the trust/review columns. */
const contentRow = (b: (typeof builds)[number]) => ({
  id: b.id,
  slug: b.slug,
  name: b.name,
  class: b.className,
  subclass_lines: b.subclassLines,
  role: b.role,
  content_type: b.contentType,
  author: b.author,
  gear: b.gear,
  front_bar: b.frontBar,
  back_bar: b.backBar,
  cp: b.cp,
  mundus_id: b.mundusId,
  food_id: b.foodId,
  guidance: b.guidance,
});

/** Trust metadata — only written when a build row is first created. */
const trustRow = (b: (typeof builds)[number]) => ({
  status: b.status,
  patch_verified: b.patchVerified,
  review_reasons: b.needsReviewReasons,
});

async function main() {
  const { data: existing, error: exErr } = await supabase.from("builds").select("id");
  if (exErr) throw new Error(`builds select: ${exErr.message}`);
  const existingIds = new Set((existing ?? []).map((r) => r.id));

  const newBuilds = builds.filter((b) => !existingIds.has(b.id));
  const updBuilds = builds.filter((b) => existingIds.has(b.id));

  if (newBuilds.length) {
    const rows = newBuilds.map((b) => ({ ...contentRow(b), ...trustRow(b) }));
    const { error } = await supabase.from("builds").insert(rows);
    if (error) throw new Error(`builds insert: ${error.message}`);
    console.log(`✓ builds: inserted ${rows.length} new (with seed trust state)`);
  }
  if (updBuilds.length) {
    // Content-only upsert: status / patch_verified / review_reasons are absent
    // from the payload, so an existing row keeps its manual /admin verification
    // and any ingest review reasons. All ids here already exist (filtered
    // against existingIds), so this only ever takes the ON CONFLICT UPDATE path.
    const rows = updBuilds.map(contentRow);
    const { error } = await supabase.from("builds").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`builds update: ${error.message}`);
    console.log(`✓ builds: updated ${rows.length} existing (trust metadata preserved)`);
  }

  const buildIds = builds.map((b) => b.id);
  const joinRows = builds.flatMap((b) =>
    buildEntityRefs(b).map((r) => ({ build_id: b.id, entity_type: r.entityType, entity_id: r.entityId }))
  );

  // Replace the join rows for exactly these builds so renamed references don't
  // leave orphans. Scoped to our build ids — no other build is touched.
  const { error: delErr } = await supabase.from("build_entities").delete().in("build_id", buildIds);
  if (delErr) throw new Error(`build_entities delete: ${delErr.message}`);
  const { error: insErr } = await supabase.from("build_entities").insert(joinRows);
  if (insErr) throw new Error(`build_entities insert: ${insErr.message}`);
  console.log(`✓ build_entities: ${joinRows.length} rows for ${buildIds.length} builds`);

  console.log("\nBuilds sync complete. Entity tables were not touched.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
