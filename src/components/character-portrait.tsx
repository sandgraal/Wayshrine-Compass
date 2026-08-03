"use client";

import { useState } from "react";
import Image from "next/image";
import type { Portrait } from "@/lib/portraits";
import { ClassSigil } from "@/components/illustrations";
import { cn } from "@/lib/utils";

/**
 * Character art. Decorative only — never announce game state through it, and
 * keep it invisible to assistive tech: the race/class it depicts is always
 * rendered as adjacent text by the consumer, so the image itself is presented
 * with an empty alt.
 *
 * The art ships in `public/chars/` (see the README there), but a portrait must
 * survive its file failing to load — a renamed or dropped asset falls back to
 * the class sigil rather than a broken image.
 */

function SigilFallback({ portrait }: { portrait: Portrait }) {
  return (
    <div aria-hidden className="bg-rune-field absolute inset-0 flex items-center justify-center bg-secondary">
      <ClassSigil name={portrait.className} className="aspect-square w-1/3 max-w-24 text-primary/35" />
    </div>
  );
}

export function CharacterPortrait({
  portrait,
  sizes,
  priority,
  className,
  objectPosition = "center 15%",
  children,
}: {
  portrait: Portrait;
  sizes: string;
  priority?: boolean;
  className?: string;
  objectPosition?: string;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {failed ? (
        <SigilFallback portrait={portrait} />
      ) : (
        <Image
          src={portrait.src}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition }}
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Blurred, desaturated copy of the portrait used as a page-header wash. Renders
 * nothing when the art is unavailable so the header keeps its flat background.
 */
export function PortraitWash({ portrait }: { portrait: Portrait }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={portrait.src}
        alt=""
        fill
        sizes="100vw"
        aria-hidden
        className="scale-125 object-cover opacity-20 blur-3xl saturate-75"
        style={{ objectPosition: "center 20%" }}
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
