"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Decorative sigil slot for entity rows and cards. Renders nothing without a
 * src (art is additive; the row's text carries the meaning), and removes
 * itself on a failed load so a missing file can never break a page — the
 * wayshrine-icon fallback pattern, including the ref check for loads that
 * 404ed before hydration attached the error handler.
 *
 * The failure is tracked by src, not a boolean: this component is reused with
 * a changing src (e.g. the class-mastery card keeps its React key across class
 * switches), so a boolean would let one missing image suppress every later
 * valid one until unmount.
 */
export function EntitySigil({
  src,
  size = 20,
  className,
}: {
  src: string | undefined;
  size?: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return null;

  return (
    // Plain <img>: a tiny decorative inline asset, no optimizer involvement,
    // and onError must fire for the remove-on-404 behavior. `key={src}` gives
    // each source a fresh element so onError re-arms when the src changes.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("inline-block shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setFailedSrc(src);
      }}
      onError={() => setFailedSrc(src)}
    />
  );
}
