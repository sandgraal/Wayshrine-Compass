import type { ClassMasteryLine } from "@/lib/types";
import { skills } from "./skills";

/**
 * Class Mastery lines — the subclassing units a build's subclassLines point
 * at (ids follow `mastery-<class>-<line>`, see src/lib/entities.ts).
 *
 * Derived from the seed skills at module load so the two files cannot drift:
 * every class line that has seed skills is a mastery line, and nothing else.
 * The seed has no `class-mastery` meta lines (those arrive with the real
 * dataset), so everything here is graftable.
 *
 * Provenance is stamped at the oldest seed patch: the demo narrative is that
 * no class line has been reworked as a unit, so no build gets ambered by
 * these stamps (a line rework would come from an ingest).
 */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const seen = new Map<string, ClassMasteryLine>();
for (const s of skills) {
  if (!s.className) continue;
  const id = `mastery-${s.className}-${s.line}`;
  if (seen.has(id)) continue;
  seen.set(id, {
    id,
    name: `${s.lineLabel} (${capitalize(s.className)})`,
    className: s.className,
    line: s.line,
    lineLabel: s.lineLabel,
    graftable: s.line !== "class-mastery",
    firstSeenPatch: "U48",
    lastChangedPatch: "U48",
  });
}

export const classMasteryLines: ClassMasteryLine[] = [...seen.values()].sort((a, b) =>
  a.id.localeCompare(b.id)
);
