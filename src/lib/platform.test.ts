import { describe, expect, it } from "vitest";
import { builds } from "@/data/builds";
import { renderGuidance } from "./platform";

/** Words that indicate addon-dependent guidance leaked through. */
const ADDON_MARKERS = [/\baddon\b/i, /\bminion\b/i, /combat metrics/i, /bandits ui/i, /srendarr/i, /\binstall\b/i];

describe("console mode (Phase 4 acceptance)", () => {
  it("with console mode on, no build's rendered guidance requires an addon", () => {
    for (const build of builds) {
      const rendered = renderGuidance(build.guidance, "console");
      for (const block of rendered) {
        for (const marker of ADDON_MARKERS) {
          // Console alternatives may mention that addons don't exist on console;
          // they must never instruct installing one.
          expect(
            /install/i.test(block.body) && marker.source.includes("install") ? false : marker.test(block.body) && !block.isConsoleAlternative,
            `${build.slug} / "${block.title}" leaked addon guidance to console: ${block.body}`
          ).toBe(false);
          expect(/\binstall\b/i.test(block.body), `${build.slug} tells console players to install something`).toBe(false);
        }
      }
    }
  });

  it("pc mode keeps addon guidance", () => {
    const withAddonBlock = builds.find((b) => b.guidance.some((g) => g.platform === "pc"));
    expect(withAddonBlock).toBeDefined();
    const rendered = renderGuidance(withAddonBlock!.guidance, "pc");
    expect(rendered.some((b) => /install/i.test(b.body))).toBe(true);
  });

  it("pc-only blocks without alternatives are dropped on console, not shown", () => {
    const rendered = renderGuidance(
      [{ platform: "pc", title: "PC only", body: "Install X addon." }],
      "console"
    );
    expect(rendered).toEqual([]);
  });
});
