import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ACTION_ART, actionArt } from "./action-art";

describe("action art map", () => {
  // The engine source is the authority on action ids; scan it rather than
  // hardcoding a second list that could drift alongside the first.
  const engineSource = readFileSync("src/lib/engine/whatNext.ts", "utf8");
  const engineIds = new Set(
    [...engineSource.matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1])
  );

  it("keys only real engine action ids", () => {
    const unknown = Object.keys(ACTION_ART).filter((k) => !engineIds.has(k));
    expect(unknown).toEqual([]);
  });

  it("covers every static engine action id", () => {
    const uncovered = [...engineIds].filter((id) => !(id in ACTION_ART));
    expect(uncovered).toEqual([]);
  });

  it("returns undefined for companion actions when the shared file has not shipped", () => {
    // No files are in SHIPPED_IDS yet; actionArt() must return undefined so
    // ActionThumb never mounts-then-fails before art lands in public/whatnext/.
    expect(actionArt("unlock-companion-companion-bastian")).toBeUndefined();
    expect(engineSource).toContain("id: `unlock-companion-${c.id}`");
  });

  it("returns undefined for unknown ids", () => {
    expect(actionArt("not-an-action")).toBeUndefined();
  });
});
