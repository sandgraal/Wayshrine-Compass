import type { PatchCode } from "@/lib/types";
import { entityChangeStatus } from "@/lib/freshness";
import { cn } from "@/lib/utils";

/**
 * Provenance pill for entity rows (/sets, /skills, patch surfaces). Unlike a
 * build's FreshnessBadge there is no human review step here, so the pill
 * reports raw provenance — and only claims a change when one was actually
 * observed (lastChanged > firstSeen). Entities sitting unchanged since the
 * baseline import render as neutral "Tracked since", which is the honest
 * reading of a first-catalog stamp.
 */
export function EntityChangeBadge({
  entity,
  patchOrder,
  className,
}: {
  entity: { firstSeenPatch: PatchCode; lastChangedPatch: PatchCode };
  patchOrder: PatchCode[];
  className?: string;
}) {
  const status = entityChangeStatus(entity, patchOrder);

  const styles = {
    changed: "bg-needs-review/15 text-needs-review border-needs-review/40",
    added: "bg-primary/10 text-primary border-primary/40",
    tracked: "border-border bg-secondary text-muted-foreground",
  }[status.kind];

  const dot = {
    changed: "bg-needs-review",
    added: "bg-primary",
    tracked: "bg-muted-foreground/50",
  }[status.kind];

  const label = {
    changed: `Changed in ${status.patch}`,
    added: `New in ${status.patch}`,
    tracked: `Tracked since ${status.patch}`,
  }[status.kind];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
