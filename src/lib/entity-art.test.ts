import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GEAR_SLOTS } from "@/lib/types";
import {
  GEAR_SLOT_GLYPHS,
  LINE_EMBLEMS,
  SET_TYPE_SIGILS,
  SHIPPED_SIGILS,
  gearSlotArt,
  lineEmblemKey,
  setTypeArt,
  skillLineArt,
} from "./entity-art";

/**
 * Manifest/disk/dataset sync, in the action-art.test.ts shape. The dataset
 * artifact is the authority on which categories exist: every set type and
 * skill line in it must resolve to a manifest entry, shipped or not.
 */

const dataset = JSON.parse(readFileSync("public/dataset/current.json", "utf8")) as {
  sets: { type: string }[];
  skills: { className: string | null; line: string }[];
  classMasteryLines: { className: string | null; line: string }[];
};

const ALL_MANIFEST_PATHS = [...Object.values(SET_TYPE_SIGILS), ...Object.values(LINE_EMBLEMS)];
// Gear-slot glyphs deliberately reuse one file across the ring pair and the
// weapon pair, so they're excluded from the uniqueness check but included in
// the disk-sync checks (any file in public/sigils/ must be a known path).
const SHIPPABLE_PATHS = [...new Set([...ALL_MANIFEST_PATHS, ...Object.values(GEAR_SLOT_GLYPHS)])];

describe("entity art manifest", () => {
  it("covers every set type in the dataset", () => {
    const uncovered = [...new Set(dataset.sets.map((s) => s.type))].filter(
      (t) => !(t in SET_TYPE_SIGILS)
    );
    expect(uncovered).toEqual([]);
  });

  it("covers every skill line in the dataset", () => {
    // Both collections carry line keys the sigil serves: class-mastery meta
    // lines live in classMasteryLines, not just skills, so guard both.
    const lineKeys = [
      ...dataset.skills.map((s) => lineEmblemKey(s)),
      ...dataset.classMasteryLines.map((m) => lineEmblemKey(m)),
    ];
    const uncovered = [...new Set(lineKeys)].filter((key) => !(key in LINE_EMBLEMS));
    expect(uncovered).toEqual([]);
  });

  it("uses unique file paths across the whole manifest", () => {
    expect(new Set(ALL_MANIFEST_PATHS).size).toBe(ALL_MANIFEST_PATHS.length);
  });

  it("covers every gear slot", () => {
    const uncovered = GEAR_SLOTS.filter((s) => !(s in GEAR_SLOT_GLYPHS));
    expect(uncovered).toEqual([]);
    // Nothing shipped yet: every slot glyph resolves to undefined, not a 404.
    for (const slot of GEAR_SLOTS) {
      const art = gearSlotArt(slot);
      if (art) expect(existsSync(join("public", art))).toBe(true);
    }
  });

  it("has a file on disk for every shipped path", () => {
    for (const path of SHIPPED_SIGILS) {
      expect(SHIPPABLE_PATHS).toContain(path);
      expect(existsSync(join("public", path)), `missing file for shipped ${path}`).toBe(true);
    }
  });

  it("has a manifest entry for every file on disk", () => {
    const dir = join("public", "sigils");
    if (!existsSync(dir)) return; // no art shipped yet
    const known = new Set(SHIPPABLE_PATHS.map((p) => p.split("/").pop()));
    for (const file of readdirSync(dir)) {
      if (file === "README.md") continue;
      expect(known.has(file), `unmanifested file public/sigils/${file}`).toBe(true);
      // A file on disk should also be flagged shipped, or it can never render.
      expect(
        SHIPPED_SIGILS.has(`/sigils/${file}`),
        `public/sigils/${file} exists but is not in SHIPPED_SIGILS`
      ).toBe(true);
    }
  });

  it("returns no art for unshipped paths, never a broken src", () => {
    // Nothing is shipped yet in this change: both helpers must return
    // undefined (the sigil slot renders nothing), not a 404-bound path.
    for (const type of Object.keys(SET_TYPE_SIGILS)) {
      const art = setTypeArt({ type: type as keyof typeof SET_TYPE_SIGILS });
      if (art) expect(existsSync(join("public", art))).toBe(true);
    }
    for (const key of Object.keys(LINE_EMBLEMS)) {
      const [className, line] = key.includes("/") ? key.split("/") : [null, key];
      const art = skillLineArt({ className: className as never, line });
      if (art) expect(existsSync(join("public", art))).toBe(true);
    }
  });
});
