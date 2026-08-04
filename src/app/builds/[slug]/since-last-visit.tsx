"use client";

import { useEffect, useState } from "react";

/**
 * "Since your last visit: N referenced entities changed." Purely client-side:
 * the last-seen timestamp lives in localStorage per build slug, compared
 * against server-provided recent changes that intersect this build's entity
 * references. First visits store the timestamp and render nothing.
 */

export interface RecentReferencedChange {
  /** ISO timestamp of the pipeline run that observed the change. */
  ranAt: string;
  entityName: string;
  summary: string;
}

const KEY_PREFIX = "wc-seen-";

function readLastSeen(slug: string): string | null {
  try {
    return localStorage.getItem(`${KEY_PREFIX}${slug}`);
  } catch {
    return null;
  }
}

function writeLastSeen(slug: string) {
  try {
    localStorage.setItem(`${KEY_PREFIX}${slug}`, new Date().toISOString());
  } catch {
    // storage unavailable; the note simply won't appear next time
  }
}

export function SinceLastVisit({
  slug,
  changes,
}: {
  slug: string;
  changes: RecentReferencedChange[];
}) {
  const [fresh, setFresh] = useState<RecentReferencedChange[] | null>(null);

  useEffect(() => {
    const lastSeen = readLastSeen(slug);
    if (lastSeen) {
      setFresh(changes.filter((c) => c.ranAt > lastSeen));
    }
    writeLastSeen(slug);
  }, [slug, changes]);

  if (!fresh || fresh.length === 0) return null;

  return (
    <div className="mb-6 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
      <p className="font-medium">
        Since your last visit, {fresh.length} {fresh.length === 1 ? "entity" : "entities"} this
        build references {fresh.length === 1 ? "has" : "have"} changed:
      </p>
      <ul className="mt-1 space-y-0.5 text-muted-foreground">
        {fresh.slice(0, 8).map((c) => (
          <li key={`${c.ranAt}:${c.entityName}`}>{c.summary}</li>
        ))}
        {fresh.length > 8 && <li>and {fresh.length - 8} more.</li>}
      </ul>
    </div>
  );
}
