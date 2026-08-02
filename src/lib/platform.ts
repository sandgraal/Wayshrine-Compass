import type { GuidanceBlock, Platform } from "@/lib/types";

export const PLATFORM_COOKIE = "wc-platform";

export interface RenderedGuidance {
  title: string;
  body: string;
  /** True when this is the console replacement for addon-dependent guidance. */
  isConsoleAlternative: boolean;
}

/**
 * Phase 4 contract: with console mode on, no rendered block may require an
 * addon. PC-flagged blocks are swapped for their console alternative, or
 * dropped when none exists.
 */
export function renderGuidance(blocks: GuidanceBlock[], platform: Platform): RenderedGuidance[] {
  const out: RenderedGuidance[] = [];
  for (const block of blocks) {
    if (block.platform === "all" || block.platform === platform) {
      out.push({ title: block.title, body: block.body, isConsoleAlternative: false });
    } else if (block.platform === "pc" && platform === "console") {
      if (block.consoleAlternative) {
        out.push({ title: block.title, body: block.consoleAlternative, isConsoleAlternative: true });
      }
      // no alternative → block is dropped entirely
    }
  }
  return out;
}
