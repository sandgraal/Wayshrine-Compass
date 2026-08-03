import { describe, it, expect } from "vitest";
import { ALL_CLASSES } from "@/lib/types";
import { PORTRAITS, portraitForBuild, portraitsForClass } from "@/lib/portraits";

describe("portrait catalog", () => {
  it("has a unique id per portrait", () => {
    const ids = PORTRAITS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every class, so no build falls back for lack of art", () => {
    for (const className of ALL_CLASSES) {
      expect(portraitsForClass(className).length).toBeGreaterThan(0);
    }
  });

  it("points every portrait at a /chars asset matching its id", () => {
    for (const p of PORTRAITS) {
      expect(p.src).toBe(`/chars/${p.id}.jpeg`);
    }
  });

  it("picks a portrait of the build's own class", () => {
    for (const className of ALL_CLASSES) {
      const picked = portraitForBuild({ id: `${className}-dps`, className });
      expect(picked?.className).toBe(className);
    }
  });

  it("is deterministic in the build id", () => {
    const build = { id: "nightblade-dps", className: "nightblade" as const };
    expect(portraitForBuild(build)?.id).toBe(portraitForBuild(build)?.id);
    expect(portraitForBuild(build)?.id).toBe(portraitForBuild({ ...build })?.id);
  });

  it("spreads builds of one class across the art available to it", () => {
    // Nightblade has four portraits; the four seed builds should not all land
    // on the same one, or the catalog's variety is wasted.
    const picked = new Set(
      ["dps", "tank", "healer", "leveling"].map(
        (role) => portraitForBuild({ id: `nightblade-${role}`, className: "nightblade" })?.id
      )
    );
    expect(picked.size).toBeGreaterThan(1);
  });
});
