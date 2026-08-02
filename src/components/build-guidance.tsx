"use client";

import type { GuidanceBlock } from "@/lib/types";
import { renderGuidance } from "@/lib/platform";
import { usePlatform } from "@/components/platform-provider";

/**
 * Renders a build's guidance blocks filtered for the active platform mode.
 * Client-side so console filtering works on static hosting.
 */
export function BuildGuidance({ blocks }: { blocks: GuidanceBlock[] }) {
  const { platform } = usePlatform();
  const guidance = renderGuidance(blocks, platform);

  return (
    <>
      {guidance.map((block) => (
        <details key={block.title} className="group rounded-lg border border-border bg-card">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium marker:text-primary">
            {block.title}
            {block.isConsoleAlternative && (
              <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                console
              </span>
            )}
          </summary>
          <p className="border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">{block.body}</p>
        </details>
      ))}
    </>
  );
}
