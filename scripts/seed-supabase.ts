/**
 * Seeds a Supabase project from the committed seed dataset.
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/seed-supabase.ts
 *
 * Idempotent: upserts by primary key.
 */
import { createClient } from "@supabase/supabase-js";
import { patches } from "../src/data/patches";
import { sets } from "../src/data/sets";
import { skills } from "../src/data/skills";
import { cpStars } from "../src/data/cpStars";
import { companions } from "../src/data/companions";
import { zones } from "../src/data/zones";
import { mundusStones } from "../src/data/mundus";
import { foods } from "../src/data/food";
import { builds } from "../src/data/builds";
import { grimoires } from "../src/data/grimoires";
import { scribingScripts } from "../src/data/scribingScripts";
import { classMasteryLines } from "../src/data/classMastery";
import { buildEntityRefs } from "../src/lib/entities";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function upsert(table: string, rows: Record<string, unknown>[], conflict = "id") {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length} rows`);
}

async function main() {
  await upsert(
    "patches",
    patches.map((p) => ({ id: p.id, code: p.code, name: p.name, released_at: p.releasedAt, season: p.season }))
  );
  await upsert(
    "sets",
    sets.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      source: s.source,
      dlc_required: s.dlcRequired,
      bonuses: s.bonuses,
      mythic_slot: s.mythicSlot ?? null,
      first_seen_patch: s.firstSeenPatch,
      last_changed_patch: s.lastChangedPatch,
    }))
  );
  await upsert(
    "skills",
    skills.map((s) => ({
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
    }))
  );
  await upsert(
    "cp_stars",
    cpStars.map((s) => ({
      id: s.id,
      tree: s.tree,
      name: s.name,
      effect: { text: s.effect },
      slottable: s.slottable,
      first_seen_patch: s.firstSeenPatch,
      last_changed_patch: s.lastChangedPatch,
    }))
  );
  await upsert(
    "companions",
    companions.map((c) => ({
      id: c.id,
      name: c.name,
      class: c.className,
      dlc_required: c.dlcRequired,
      unlock_zone: c.unlockZone,
      unlock_npc: c.unlockNpc,
      role_ratings: c.roleRatings,
    }))
  );
  await upsert(
    "zones",
    zones.map((z) => ({ id: z.id, name: z.name, dlc_required: z.dlcRequired, level_scaled: z.levelScaled }))
  );
  await upsert(
    "mundus_stones",
    mundusStones.map((m) => ({ id: m.id, name: m.name, effect: { text: m.effect, stats: m.stats ?? [] } }))
  );
  await upsert(
    "foods",
    foods.map((f) => ({ id: f.id, name: f.name, effect: { text: f.effect, stats: f.stats ?? [] } }))
  );
  await upsert(
    "grimoires",
    grimoires.map((g) => ({
      id: g.id,
      name: g.name,
      line: g.line,
      line_label: g.lineLabel,
      description: g.description,
      acquisition: g.acquisition,
      dlc_required: g.dlcRequired,
      focus_scripts: g.focusScripts,
      signature_scripts: g.signatureScripts,
      affix_scripts: g.affixScripts,
      first_seen_patch: g.firstSeenPatch,
      last_changed_patch: g.lastChangedPatch,
    }))
  );
  await upsert(
    "scribing_scripts",
    scribingScripts.map((s) => ({
      id: s.id,
      name: s.name,
      slot: s.slot,
      description: s.description,
      acquisition: s.acquisition,
      first_seen_patch: s.firstSeenPatch,
      last_changed_patch: s.lastChangedPatch,
    }))
  );
  await upsert(
    "class_mastery_lines",
    classMasteryLines.map((m) => ({
      id: m.id,
      name: m.name,
      class: m.className,
      line: m.line,
      line_label: m.lineLabel,
      graftable: m.graftable,
      first_seen_patch: m.firstSeenPatch,
      last_changed_patch: m.lastChangedPatch,
    }))
  );
  await upsert(
    "builds",
    builds.map((b) => ({
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
    }))
  );
  const joinRows = builds.flatMap((b) =>
    buildEntityRefs(b).map((r) => ({ build_id: b.id, entity_type: r.entityType, entity_id: r.entityId }))
  );
  await upsert("build_entities", joinRows, "build_id,entity_type,entity_id");

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
