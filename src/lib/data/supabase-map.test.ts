import { describe, expect, it } from "vitest";
import { builds } from "@/data/builds";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import { mundusStones } from "@/data/mundus";
import { foods } from "@/data/food";
import { companions } from "@/data/companions";
import { zones } from "@/data/zones";
import { patches } from "@/data/patches";
import { grimoires } from "@/data/grimoires";
import { scribingScripts } from "@/data/scribingScripts";
import { classMasteryLines } from "@/data/classMastery";
import {
  rowToBuild,
  rowToCompanion,
  rowToCpStar,
  rowToFood,
  rowToGrimoire,
  rowToMasteryLine,
  rowToMundus,
  rowToPatch,
  rowToScript,
  rowToSet,
  rowToSkill,
  rowToZone,
} from "./supabase-map";

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
      const row = { id: s.id, tree: s.tree, name: s.name, effect: { text: s.effect }, slottable: s.slottable, first_seen_patch: s.firstSeenPatch, last_changed_patch: s.lastChangedPatch };
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

  it("patches, companions, zones round-trip", () => {
    for (const p of patches) {
      const row = { id: p.id, code: p.code, name: p.name, released_at: p.releasedAt, season: p.season };
      expect(rowToPatch(row)).toEqual(p);
    }
    for (const c of companions) {
      const row = {
        id: c.id, name: c.name, class: c.className, dlc_required: c.dlcRequired,
        unlock_zone: c.unlockZone, unlock_npc: c.unlockNpc, role_ratings: c.roleRatings,
      };
      expect(rowToCompanion(row)).toEqual(c);
    }
    for (const z of zones) {
      const row = { id: z.id, name: z.name, dlc_required: z.dlcRequired, level_scaled: z.levelScaled };
      expect(rowToZone(row)).toEqual(z);
    }
  });

  it("grimoires, scripts, mastery lines round-trip", () => {
    for (const g of grimoires) {
      const row = {
        id: g.id, name: g.name, line: g.line, line_label: g.lineLabel,
        description: g.description, acquisition: g.acquisition, dlc_required: g.dlcRequired,
        focus_scripts: g.focusScripts, signature_scripts: g.signatureScripts, affix_scripts: g.affixScripts,
        first_seen_patch: g.firstSeenPatch, last_changed_patch: g.lastChangedPatch,
      };
      expect(rowToGrimoire(row)).toEqual(g);
    }
    for (const s of scribingScripts) {
      const row = {
        id: s.id, name: s.name, slot: s.slot, description: s.description, acquisition: s.acquisition,
        first_seen_patch: s.firstSeenPatch, last_changed_patch: s.lastChangedPatch,
      };
      expect(rowToScript(row)).toEqual(s);
    }
    for (const m of classMasteryLines) {
      const row = {
        id: m.id, name: m.name, class: m.className, line: m.line, line_label: m.lineLabel,
        graftable: m.graftable, first_seen_patch: m.firstSeenPatch, last_changed_patch: m.lastChangedPatch,
      };
      expect(rowToMasteryLine(row)).toEqual(m);
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

  it("normalizes the scribed_skills column default ([]) to absent", () => {
    const base = builds[0];
    const row = {
      id: base.id, slug: base.slug, name: base.name, class: base.className,
      subclass_lines: base.subclassLines, role: base.role, content_type: base.contentType,
      author: base.author, status: base.status, patch_verified: base.patchVerified,
      gear: base.gear, front_bar: base.frontBar, back_bar: base.backBar, cp: base.cp,
      mundus_id: base.mundusId, food_id: base.foodId, guidance: base.guidance,
      review_reasons: base.needsReviewReasons,
    };
    expect(rowToBuild({ ...row, scribed_skills: [] }).scribedSkills).toBeUndefined();
    const scribed = [{ grimoireId: "grimoire-vault", scriptIds: ["script-bleed-damage"] }];
    expect(rowToBuild({ ...row, scribed_skills: scribed }).scribedSkills).toEqual(scribed);
  });
});
