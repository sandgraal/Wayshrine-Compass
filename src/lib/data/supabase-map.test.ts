import { describe, expect, it } from "vitest";
import { builds } from "@/data/builds";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { rowToBuild, rowToCpStar, rowToFood, rowToMundus, rowToSet, rowToSkill } from "./supabase-map";

/**
 * Round-trip: entity → DB row (the seeder's column mapping) → entity must be
 * identity. Guards the read adapter against drifting from the write path.
 */
describe("supabase row mappers", () => {
  it("sets round-trip", () => {
    for (const s of sets) {
      const row = {
        id: s.id, name: s.name, type: s.type, source: s.source, dlc_required: s.dlcRequired,
        bonuses: s.bonuses, mythic_slot: s.mythicSlot ?? null,
        first_seen_patch: s.firstSeenPatch, last_changed_patch: s.lastChangedPatch,
      };
      expect(rowToSet(row)).toEqual(s);
    }
  });

  it("skills round-trip", () => {
    for (const s of skills) {
      const row = {
        id: s.id, class: s.className, line: s.line, line_label: s.lineLabel, name: s.name,
        ultimate: s.ultimate, description: s.description, morphs: s.morphs,
        first_seen_patch: s.firstSeenPatch, last_changed_patch: s.lastChangedPatch,
      };
      expect(rowToSkill(row)).toEqual(s);
    }
  });

  it("cp stars, mundus, food round-trip", () => {
    for (const s of cpStars) {
      const row = { id: s.id, tree: s.tree, name: s.name, effect: { text: s.effect }, slottable: s.slottable, last_changed_patch: s.lastChangedPatch };
      expect(rowToCpStar(row)).toEqual(s);
    }
    for (const m of mundusStones) {
      const row = { id: m.id, name: m.name, effect: { text: m.effect, stats: m.stats ?? [] } };
      expect(rowToMundus(row)).toEqual({ ...m, stats: m.stats ?? [] });
    }
    for (const f of foods) {
      const row = { id: f.id, name: f.name, effect: { text: f.effect, stats: f.stats ?? [] } };
      expect(rowToFood(row)).toEqual({ ...f, stats: f.stats ?? [] });
    }
  });

  it("builds round-trip", () => {
    for (const b of builds) {
      const row = {
        id: b.id, slug: b.slug, name: b.name, class: b.className, subclass_lines: b.subclassLines,
        role: b.role, content_type: b.contentType, author: b.author, status: b.status,
        patch_verified: b.patchVerified, gear: b.gear, front_bar: b.frontBar, back_bar: b.backBar,
        cp: b.cp, mundus_id: b.mundusId, food_id: b.foodId, guidance: b.guidance,
        review_reasons: b.needsReviewReasons,
      };
      expect(rowToBuild(row)).toEqual(b);
    }
  });
});
