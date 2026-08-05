"use client";

import { useState } from "react";
import type { Freshness } from "@/lib/freshness";
import { cn } from "@/lib/utils";

/**
 * Wayshrine state icon for freshness badges: lit for verified, a dim ember for
 * needs-review, unlit stone for stale. Purely decorative — the badge's text
 * and colors keep carrying the meaning.
 *
 * Falls back to the badge's original colored dot until the art exists in
 * public/freshness/ (see src/assets/freshness/README.md), so this ships before the icons do.
 */

const ICON_SRC: Record<Freshness["status"], string> = {
  verified: "/freshness/wayshrine-lit.png",
  needs_review: "/freshness/wayshrine-dim.png",
  stale: "/freshness/wayshrine-unlit.png",
};

export function WayshrineIcon({ status }: { status: Freshness["status"] }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn("size-1.5 rounded-full", {
          "bg-verified": status === "verified",
          "bg-needs-review": status === "needs_review",
          "bg-stale": status === "stale",
        })}
      />
    );
  }

  return (
    // Plain <img>: 18px decorative inline asset, no optimizer involvement, and
    // onError must fire for the dot fallback when the PNG doesn't exist yet.
    // The ref covers loads that already 404ed before hydration attached the
    // handler (server-rendered pages), where onError never re-fires.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICON_SRC[status]}
      alt=""
      aria-hidden
      width={18}
      height={18}
      className="-my-0.5 size-[18px] object-contain"
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}
