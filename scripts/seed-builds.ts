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
 * Non-destructive to entity tables. For build_entities it deletes and reinserts
 * the join rows of exactly the builds it writes, so a renamed/removed reference
 * never leaves a stale join row behind.
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

async function main() {
  const buildRows = builds.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    class: b.className,
    subclass_lines: b.subclassLines,
    role: b.role,
    content_type: b.contentType,
    author: b.author,
    status: b.status,
    patch_verified: b.patchVerified,
    gear: b.gear,
    front_bar: b.frontBar,
    back_bar: b.backBar,
    cp: b.cp,
    mundus_id: b.mundusId,
    food_id: b.foodId,
    guidance: b.guidance,
    review_reasons: b.needsReviewReasons,
  }));

  const { error: buildErr } = await supabase.from("builds").upsert(buildRows, { onConflict: "id" });
  if (buildErr) throw new Error(`builds: ${buildErr.message}`);
  console.log(`✓ builds: ${buildRows.length} rows upserted`);

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
