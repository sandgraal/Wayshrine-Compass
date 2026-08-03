"use client";

import { useState } from "react";
import Image from "next/image";
import { actionArt } from "./action-art";

/**
 * Decorative thumbnail for a What Next result card. Renders nothing on a map
 * miss or a missing file, so cards look exactly like the art-less layout until
 * an image exists in public/whatnext/.
 */
export function ActionThumb({ actionId }: { actionId: string }) {
  const src = actionArt(actionId);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/60">
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="4rem"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
