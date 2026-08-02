import * as React from "react";
import { FreshnessBadge } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

/**
 * Freshness objects mirror what src/lib/freshness.ts::computeFreshness returns.
 * `reasons` is only populated for needs_review; the badge itself renders the
 * status pill, while callers render the reason list separately.
 */
const VERIFIED = { status: "verified" as const, reasons: [], patchVerified: "U50", patchesBehind: 0 };
const NEEDS_REVIEW = {
  status: "needs_review" as const,
  reasons: [
    {
      entityType: "skill" as const,
      entityId: "sorcerer/storm-calling/crystal-shard",
      summary: "Crystal Shard changed in U50",
      patch: "U50",
    },
  ],
  patchVerified: "U50",
  patchesBehind: 0,
};
const STALE = { status: "stale" as const, reasons: [], patchVerified: "U47", patchesBehind: 3 };

export const Statuses = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-3">
      <FreshnessBadge freshness={VERIFIED} currentPatch="U50" />
      <FreshnessBadge freshness={NEEDS_REVIEW} currentPatch="U50" />
      <FreshnessBadge freshness={STALE} currentPatch="U50" />
    </div>
  </Surface>
);

export const OnBuildHeader = () => (
  <Surface>
    <div className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Sorcerer DPS</h1>
        <FreshnessBadge freshness={VERIFIED} currentPatch="U50" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Nightblade DPS</h1>
        <FreshnessBadge freshness={NEEDS_REVIEW} currentPatch="U50" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Templar Healer</h1>
        <FreshnessBadge freshness={STALE} currentPatch="U50" />
      </div>
    </div>
  </Surface>
);

export const WithReason = () => (
  <Surface>
    <div className="flex max-w-xl flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">Nightblade DPS</h1>
        <FreshnessBadge freshness={NEEDS_REVIEW} currentPatch="U50" />
      </div>
      <div className="rounded-md border border-needs-review/40 bg-needs-review/10 px-3 py-2 text-xs">
        {NEEDS_REVIEW.reasons.map((r) => (
          <p key={r.entityId}>{r.summary}</p>
        ))}
      </div>
    </div>
  </Surface>
);
