"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Freshness } from "@/lib/freshness";
import { FreshnessBadge } from "@/components/freshness-badge";

export interface ReviewItem {
  id: string;
  slug: string;
  name: string;
  freshness: Freshness;
}

/**
 * The interactive half of the review queue. The admin token lives in
 * component state only — never localStorage, never a cookie — so a shared
 * machine holds it exactly as long as the tab. A build only turns green via
 * router.refresh() after the API confirms the re-stamp; nothing here fakes a
 * verified badge client-side.
 */
export function ReviewConsole({ items, currentPatch }: { items: ReviewItem[]; currentPatch: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function markReviewed(buildId: string) {
    setPending(buildId);
    setErrors((e) => ({ ...e, [buildId]: "" }));
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ buildId, patch: currentPatch }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrors((e) => ({ ...e, [buildId]: body?.error ?? `request failed (HTTP ${res.status})` }));
      }
    } catch {
      setErrors((e) => ({ ...e, [buildId]: "network error" }));
    } finally {
      setPending(null);
    }
  }

  const queue = items.filter((i) => i.freshness.status !== "verified");
  const verified = items.filter((i) => i.freshness.status === "verified");

  return (
    <div>
      <label className="mt-6 block text-sm font-medium" htmlFor="admin-token">
        Admin token
      </label>
      <input
        id="admin-token"
        type="password"
        autoComplete="off"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ADMIN_SECRET"
        className="mt-1 w-full max-w-md rounded-md border border-border bg-card px-3 py-2 text-sm font-mono"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Held in memory for this tab only; each button sends it as a bearer token.
      </p>

      {queue.length === 0 ? (
        <p className="mt-8 rounded-lg border border-verified/40 bg-verified/10 p-4 text-sm text-verified">
          Queue is empty — every build is verified for {currentPatch}.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {queue.map(({ id, slug, name, freshness }) => (
            <li key={id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/builds/${slug}`} className="font-semibold underline-offset-4 hover:underline">
                  {name}
                </Link>
                <FreshnessBadge freshness={freshness} currentPatch={currentPatch} />
              </div>
              {freshness.reasons.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {freshness.reasons.map((r) => (
                    <li key={`${r.entityType}:${r.entityId}`}>
                      <span className="font-mono text-needs-review">{r.entityType}</span> {r.summary}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last verified {freshness.patchVerified} — {freshness.patchesBehind} patches behind.
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => markReviewed(id)}
                  disabled={!token || pending !== null}
                  className="rounded-md border border-verified/40 bg-verified/10 px-3 py-1.5 text-xs font-medium text-verified hover:bg-verified/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === id ? "Re-stamping…" : `Mark reviewed for ${currentPatch}`}
                </button>
                {errors[id] ? (
                  <p role="alert" className="text-xs text-stale">
                    {errors[id]}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {verified.length > 0 ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {verified.length} verified build{verified.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-3 space-y-2">
            {verified.map(({ id, slug, name, freshness }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2">
                <Link href={`/builds/${slug}`} className="text-sm underline-offset-4 hover:underline">
                  {name}
                </Link>
                <FreshnessBadge freshness={freshness} currentPatch={currentPatch} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
