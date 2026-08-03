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

  it("matches the seed's class-skill ids closely enough to diff, not replace", () => {
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
    ];
    for (const text of texts) {
      expect(text).not.toContain("|c");
    }
  });
});
