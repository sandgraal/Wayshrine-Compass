import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parsePatchDataset } from "@/lib/ingest/parse";

const SET_TYPES = ["crafted", "overland", "dungeon", "trial", "arena", "pvp", "monster", "mythic"];
const CLASSES = [
  "dragonknight",
  "sorcerer",
  "nightblade",
  "templar",
  "warden",
  "necromancer",
  "arcanist",
];

import { skills as seedSkills } from "@/data/skills";
import { builds as seedBuilds } from "@/data/builds";
import { ALL_DLC_IDS } from "@/data/zones";
import { masteryLineId } from "@/lib/entities";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs module, no type declarations
import { resolveSetDlc } from "./build-dataset.mjs";

const file = path.resolve(__dirname, "..", "public", "dataset", "current.json");
const dataset = parsePatchDataset(JSON.parse(fs.readFileSync(file, "utf8")));

describe("public/dataset/current.json", () => {
  it("parses as a valid PatchDataset", () => {
    expect(dataset).not.toBeNull();
  });

  it("uses seed-compatible skill ids so diffs match existing entities", () => {
    for (const s of dataset!.skills) {
      expect(s.id).toMatch(/^skill-[a-z]+-[a-z0-9-]+$/);
      expect(s.id.startsWith(`skill-${s.className ?? "weapon"}-${s.line}-`)).toBe(true);
    }
  });

  it("matches the seed's skill ids (class and weapon lines) closely enough to diff, not replace", () => {
    const dsIds = new Set(dataset!.skills.map((s) => s.id));
    const matched = seedSkills.filter((s) => dsIds.has(s.id)).length;
    // 112/117 at snapshot time (5 real in-game renames); drift craters this.
    expect(matched).toBeGreaterThanOrEqual(112);
  });

  it("carries the site's current patch", () => {
    // A PTS dump or parser regression must not publish under the wrong patch.
    expect(dataset!.patch.code).toBe("U50");
  });

  it("has exactly the committed snapshot's entity counts", () => {
    // Dataset changes arrive as reviewed PRs, so pin exact counts — a partial
    // extraction after an upstream schema change must fail, not shrink quietly.
    expect(dataset!.sets.length).toBe(641);
    expect(dataset!.skills.length).toBe(433);
    expect(dataset!.cpStars.length).toBe(118);
    expect(dataset!.grimoires.length).toBe(12);
    expect(dataset!.scripts.length).toBe(67);
    expect(dataset!.classMasteryLines.length).toBe(28);
  });

  it("gates every grimoire on the Gold Road chapter", () => {
    for (const g of dataset!.grimoires) {
      expect(g.dlcRequired, g.id).toBe("gold-road");
      expect(ALL_DLC_IDS).toContain(g.dlcRequired);
    }
  });

  it("resolves every grimoire script ref to a script of the matching slot", () => {
    const scriptById = new Map(dataset!.scripts.map((s) => [s.id, s]));
    for (const g of dataset!.grimoires) {
      const slots = [
        ["focus", g.focusScripts],
        ["signature", g.signatureScripts],
        ["affix", g.affixScripts],
      ] as const;
      for (const [slot, ids] of slots) {
        expect(ids.length, `${g.id} ${slot}`).toBeGreaterThan(0);
        for (const id of ids) {
          expect(scriptById.get(id)?.slot, `${g.id} → ${id}`).toBe(slot);
        }
      }
    }
  });

  it("derives Class Mastery lines exactly from the dataset's class skill lines", () => {
    const fromSkills = new Set(
      dataset!.skills.filter((s) => s.className).map((s) => `mastery-${s.className}-${s.line}`)
    );
    expect(new Set(dataset!.classMasteryLines.map((m) => m.id))).toEqual(fromSkills);
    for (const m of dataset!.classMasteryLines) {
      expect(m.id).toBe(`mastery-${m.className}-${m.line}`);
      // Only each class's own Class Mastery meta line is non-graftable.
      expect(m.graftable, m.id).toBe(m.line !== "class-mastery");
    }
  });

  it("covers every seed build's subclassLines (else builds would amber as removed refs)", () => {
    const ids = new Set(dataset!.classMasteryLines.map((m) => m.id));
    for (const b of seedBuilds) {
      for (const line of b.subclassLines) {
        expect(ids, `${b.id} → ${line}`).toContain(masteryLineId(line));
      }
    }
  });

  it("matches the migration 0005 Class Mastery backfill row-for-row", () => {
    // The backfill exists so the first ingest after deploy diffs clean; a
    // drifted row would mark every referencing build needs_review. See
    // supabase/migrations/0005_scribing_class_mastery.sql.
    const sql = fs.readFileSync(
      path.resolve(__dirname, "..", "supabase", "migrations", "0005_scribing_class_mastery.sql"),
      "utf8"
    );
    const unq = (s: string) => s.replace(/''/g, "'");
    const rowRe = /^\s+\('((?:[^']|'')*)', '((?:[^']|'')*)', '((?:[^']|'')*)', '((?:[^']|'')*)', '((?:[^']|'')*)', (true|false)\),?$/gm;
    const rows = [...sql.matchAll(rowRe)].map((m) => ({
      id: unq(m[1]),
      name: unq(m[2]),
      className: unq(m[3]),
      line: unq(m[4]),
      lineLabel: unq(m[5]),
      graftable: m[6] === "true",
    }));
    expect(rows).toEqual(dataset!.classMasteryLines);
  });

  it("resolves DLC gates per set type (table-driven resolver contract)", () => {
    const cases: [string, string, string | null][] = [
      // dungeon/trial: the *dungeon* segment names the gate, not the zone
      ["dungeon", "Summerset, Coral Aerie", "ascending-tide"],
      ["dungeon", "Blackwood, The Dread Cellar", "waking-flame"],
      ["dungeon", "Scrivener's Hall", "scribes-of-fate"],
      ["dungeon", "Auridon, The Banished Cells", null],
      ["trial", "Greymoor, Kyne's Aegis", "greymoor"],
      ["trial", "Lucent Citadel", "gold-road"],
      ["trial", "Craglorn, Aetherian Archive", null],
      // monster: dungeon in "Boss in Dungeon", roman wing suffix stripped
      ["monster", "Balorgh in March of Sacrifices, Urgarlag Chief-bane", "wolfhunter"],
      ["monster", "Allene Pellingare or Varaine Pellingare in Wayrest Sewers II, Maj al-Ragath", null],
      ["monster", "Baron Thirsk in Nobles District, Tel Var lockbox merchant", "imperial-city"],
      // whole-source types
      ["overland", "Western Skyrim", "greymoor"],
      ["overland", "Auridon", null],
      ["arena", "Maelstrom Arena", "orsinium"],
      ["pvp", "Imperial City Treasure Vaults", "imperial-city"],
      ["pvp", "Rewards for the Worthy", null],
      // conservative nulls regardless of place
      ["crafted", "Vvardenfell, Marandus", null],
      ["mythic", "Fragment Leads", null],
    ];
    for (const [type, source, expected] of cases) {
      const unmapped = new Map<string, number>();
      expect(resolveSetDlc(type, source, unmapped), `${type} :: ${source}`).toBe(expected);
      expect(unmapped.size, `${type} :: ${source} should be a known place`).toBe(0);
    }
    // Unknown places stay null and are recorded, keyed by the extracted place.
    const unmapped = new Map<string, number>();
    expect(resolveSetDlc("dungeon", "Fake Zone, Fake Dungeon", unmapped)).toBeNull();
    expect(unmapped.get("Fake Dungeon")).toBe(1);
  });

  it("gates a healthy share of sets behind known DLC ids", () => {
    const gated = dataset!.sets.filter((s) => s.dlcRequired !== null);
    // 310 at snapshot time; a mapping regression (or an upstream sources-field
    // change) collapsing DLC coverage must fail loudly, not silently un-gate.
    expect(gated.length).toBeGreaterThanOrEqual(100);
    for (const s of gated) {
      // Every emitted id must be ownable in a profile, or the What Next
      // engine would treat the set as permanently inaccessible.
      expect(ALL_DLC_IDS, `${s.id} dlcRequired=${s.dlcRequired}`).toContain(s.dlcRequired);
    }
  });

  it("keeps crafted and mythic sets ungated", () => {
    for (const s of dataset!.sets) {
      if (s.type === "crafted" || s.type === "mythic") {
        expect(s.dlcRequired, s.id).toBeNull();
      }
    }
  });

  it("only uses allowed set types", () => {
    for (const set of dataset!.sets) {
      expect(SET_TYPES).toContain(set.type);
    }
  });

  it("covers all three CP trees", () => {
    const trees = new Set(dataset!.cpStars.map((s) => s.tree));
    expect(trees).toEqual(new Set(["warfare", "fitness", "craft"]));
  });

  it("has at least one ultimate per class", () => {
    for (const className of CLASSES) {
      const ults = dataset!.skills.filter((s) => s.className === className && s.ultimate);
      expect(ults.length, `${className} ultimates`).toBeGreaterThanOrEqual(1);
    }
  });

  it("contains no ESO color codes in any effect or description", () => {
    const texts: string[] = [
      ...dataset!.sets.flatMap((s) => s.bonuses.map((b) => b.effect)),
      ...dataset!.skills.flatMap((s) => [s.description, ...s.morphs.map((m) => m.description)]),
      ...dataset!.cpStars.map((s) => s.effect),
      ...dataset!.grimoires.flatMap((g) => [g.description, g.acquisition]),
      ...dataset!.scripts.flatMap((s) => [s.description, s.acquisition]),
    ];
    for (const text of texts) {
      expect(text).not.toContain("|c");
    }
  });
});
