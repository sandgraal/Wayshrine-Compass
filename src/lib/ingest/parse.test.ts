import { describe, expect, it } from "vitest";
import { parsePatchDataset } from "./parse";

describe("parsePatchDataset", () => {
  const valid = {
    patch: { code: "U51" },
    sets: [{ id: "set-a", name: "A" }],
    skills: [],
    cpStars: [],
  };

  it("accepts a minimal valid dataset and fills patch defaults", () => {
    const parsed = parsePatchDataset(valid);
    expect(parsed).not.toBeNull();
    expect(parsed!.patch).toEqual({
      id: "patch-u51",
      code: "U51",
      name: "U51",
      releasedAt: "",
      season: null,
    });
    expect(parsed!.sets).toHaveLength(1);
  });

  it("rejects structurally invalid payloads", () => {
    expect(parsePatchDataset(null)).toBeNull();
    expect(parsePatchDataset("string")).toBeNull();
    expect(parsePatchDataset({})).toBeNull();
    expect(parsePatchDataset({ patch: { code: "" }, sets: [], skills: [], cpStars: [] })).toBeNull();
    expect(parsePatchDataset({ patch: { code: "U51" }, sets: "nope", skills: [], cpStars: [] })).toBeNull();
    // entities without string ids can't be diffed
    expect(
      parsePatchDataset({ patch: { code: "U51" }, sets: [{ name: "no id" }], skills: [], cpStars: [] })
    ).toBeNull();
  });

  it("preserves explicit patch metadata", () => {
    const parsed = parsePatchDataset({
      ...valid,
      patch: { id: "patch-x", code: "U51", name: "Update 51", releasedAt: "2026-09-07", season: "Season 2" },
    });
    expect(parsed!.patch.name).toBe("Update 51");
    expect(parsed!.patch.season).toBe("Season 2");
  });
});
