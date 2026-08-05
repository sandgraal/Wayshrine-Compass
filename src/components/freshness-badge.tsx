import type { Freshness } from "@/lib/freshness";
import { WayshrineIcon } from "@/components/wayshrine-icon";
import { cn } from "@/lib/utils";

const LABELS: Record<Freshness["status"], (f: Freshness, current: string) => string> = {
  verified: (_f, current) => `Verified for ${current}`,
  needs_review: () => "Needs review",
  stale: (f) => `Stale: last verified ${f.patchVerified}`,
};

export function FreshnessBadge({
  freshness,
  currentPatch,
  className,
}: {
  freshness: Freshness;
  currentPatch: string;
  className?: string;
}) {
  const styles = {
    verified: "bg-verified/15 text-verified border-verified/40",
    needs_review: "bg-needs-review/15 text-needs-review border-needs-review/40",
    stale: "bg-stale/15 text-stale border-stale/40",
  }[freshness.status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles,
        className
      )}
    >
      <WayshrineIcon key={freshness.status} status={freshness.status} />
      {LABELS[freshness.status](freshness, currentPatch)}
    </span>
  );
}
