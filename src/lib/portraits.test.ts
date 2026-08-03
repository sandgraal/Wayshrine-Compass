import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { ALL_CLASSES } from "@/lib/types";
import {
  ALL_RACES,
  PORTRAITS,
  pickPortrait,
  portraitForBuild,
  portraitsForClass,
  portraitsMatching,
} from "@/lib/portraits";

describe("portrait catalog", () => {
  it("has a unique id per portrait", () => {
    const ids = PORTRAITS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the files actually in public/chars", () => {
    // The manifest is hand-maintained; drift either way means a build renders a
    // 404 or a delivered portrait is silently unreachable.
    const onDisk = readdirSync("public/chars")
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(/\.webp$/, ""))
      .sort();
    expect(PORTRAITS.map((p) => p.id).sort()).toEqual(onDisk);
  });

  it("covers every race and class, so no build falls back for lack of art", () => {
    for (const className of ALL_CLASSES) {
      expect(portraitsForClass(className).length).toBeGreaterThan(0);
    }
    for (const race of ALL_RACES) {
      expect(portraitsMatching({ race }).length).toBeGreaterThan(0);
    }
  });

  it("offers both genders for every race and class combination", () => {
    for (const race of ALL_RACES) {
      for (const className of ALL_CLASSES) {
        for (const gender of ["male", "female"] as const) {
          expect(portraitsMatching({ race, className, gender }).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("points every portrait at a /chars asset matching its id", () => {
    for (const p of PORTRAITS) {
      expect(p.src).toBe(`/chars/${p.id}.webp`);
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
    expect(portraitForBuild(build)?.id).toBe(portraitForBuild({ ...build })?.id);
  });

  it("keeps a build's portrait when unrelated art is added or removed", () => {
    // Rendezvous hashing: a build only remaps when its own winner appears or
    // disappears, so catalog growth must not reshuffle existing assignments.
    const options = portraitsForClass("nightblade");
    const winner = pickPortrait("nightblade-dps", options);
    expect(winner).toBeDefined();

    const withoutLoser = options.filter((p) => p.id !== winner!.id).slice(1);
    expect(pickPortrait("nightblade-dps", [winner!, ...withoutLoser])?.id).toBe(winner!.id);

    const newcomer = { ...winner!, id: "zz-hypothetical-new-portrait" };
    const grown = pickPortrait("nightblade-dps", [...options, newcomer]);
    expect([winner!.id, newcomer.id]).toContain(grown?.id);
  });

  it("spreads builds of one class across the art available to it", () => {
    const picked = new Set(
      ["dps", "tank", "healer", "leveling"].map(
        (role) => portraitForBuild({ id: `nightblade-${role}`, className: "nightblade" })?.id
      )
    );
    expect(picked.size).toBeGreaterThan(1);
  });
});
