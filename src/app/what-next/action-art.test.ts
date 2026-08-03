import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("resolves companion actions to the shared shipped illustration", () => {
    expect(actionArt("unlock-companion-companion-bastian")).toBe(
      "/whatnext/unlock-companion.webp"
    );
    expect(engineSource).toContain("id: `unlock-companion-${c.id}`");
  });

  it("has a WebP file on disk for every map entry and the companion art", () => {
    const paths = [
      ...Object.values(ACTION_ART),
      "/whatnext/unlock-companion.webp",
    ];
    for (const p of paths) {
      expect(existsSync(join("public", p!)), `missing file for ${p}`).toBe(
        true
      );
    }
  });

  it("returns the mapped path for shipped ids", () => {
    for (const [id, path] of Object.entries(ACTION_ART)) {
      expect(actionArt(id)).toBe(path);
    }
  });

  it("returns undefined for unknown ids", () => {
    expect(actionArt("not-an-action")).toBeUndefined();
  });
});
