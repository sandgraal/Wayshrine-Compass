/**
 * Emits idempotent seed SQL from the committed dataset, for environments where
 * the service-role key isn't at hand (e.g. seeding through the Supabase SQL
 * editor or MCP). Mirrors scripts/seed-supabase.ts exactly.
 *
 *   npx tsx scripts/generate-seed-sql.ts > seed.sql
 */
import { patches } from "../src/data/patches";
import { sets } from "../src/data/sets";
import { skills } from "../src/data/skills";
import { cpStars } from "../src/data/cpStars";
import { companions } from "../src/data/companions";
import { zones } from "../src/data/zones";
import { mundusStones } from "../src/data/mundus";
import { foods } from "../src/data/food";
import { builds } from "../src/data/builds";
import { buildEntityRefs } from "../src/lib/entities";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

function upsert(table: string, cols: string[], rows: unknown[][], conflict: string) {
  const updates = cols.filter((c) => !conflict.split(",").includes(c));
  console.log(
    `insert into ${table} (${cols.join(",")}) values\n` +
      rows.map((r) => `(${r.map(q).join(",")})`).join(",\n") +
      `\non conflict (${conflict}) do update set ${updates.map((c) => `${c}=excluded.${c}`).join(",")};\n`
  );
}

upsert("patches", ["id", "code", "name", "released_at", "season"], patches.map((p) => [p.id, p.code, p.name, p.releasedAt, p.season]), "id");
upsert(
  "sets",
  ["id", "name", "type", "source", "dlc_required", "bonuses", "mythic_slot", "first_seen_patch", "last_changed_patch"],
  sets.map((s) => [s.id, s.name, s.type, s.source, s.dlcRequired, s.bonuses, s.mythicSlot ?? null, s.firstSeenPatch, s.lastChangedPatch]),
  "id"
);
upsert(
  "skills",
  ["id", "class", "line", "line_label", "name", "ultimate", "description", "morphs", "first_seen_patch", "last_changed_patch"],
  skills.map((s) => [s.id, s.className, s.line, s.lineLabel, s.name, s.ultimate, s.description, s.morphs, s.firstSeenPatch, s.lastChangedPatch]),
  "id"
);
upsert(
  "cp_stars",
  ["id", "tree", "name", "effect", "slottable", "last_changed_patch"],
  cpStars.map((s) => [s.id, s.tree, s.name, { text: s.effect }, s.slottable, s.lastChangedPatch]),
  "id"
);
upsert(
  "companions",
  ["id", "name", "class", "dlc_required", "unlock_zone", "unlock_npc", "role_ratings"],
  companions.map((c) => [c.id, c.name, c.className, c.dlcRequired, c.unlockZone, c.unlockNpc, c.roleRatings]),
  "id"
);
upsert("zones", ["id", "name", "dlc_required", "level_scaled"], zones.map((z) => [z.id, z.name, z.dlcRequired, z.levelScaled]), "id");
upsert("mundus_stones", ["id", "name", "effect"], mundusStones.map((m) => [m.id, m.name, { text: m.effect, stats: m.stats ?? [] }]), "id");
upsert("foods", ["id", "name", "effect"], foods.map((f) => [f.id, f.name, { text: f.effect, stats: f.stats ?? [] }]), "id");
upsert(
  "builds",
  ["id", "slug", "name", "class", "subclass_lines", "role", "content_type", "author", "status", "patch_verified", "gear", "front_bar", "back_bar", "cp", "mundus_id", "food_id", "guidance", "review_reasons"],
  builds.map((b) => [b.id, b.slug, b.name, b.className, b.subclassLines, b.role, b.contentType, b.author, b.status, b.patchVerified, b.gear, b.frontBar, b.backBar, b.cp, b.mundusId, b.foodId, b.guidance, b.needsReviewReasons]),
  "id"
);
upsert(
  "build_entities",
  ["build_id", "entity_type", "entity_id"],
  builds.flatMap((b) => buildEntityRefs(b).map((r) => [b.id, r.entityType, r.entityId])),
  "build_id,entity_type,entity_id"
);
