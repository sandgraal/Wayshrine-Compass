import type { ClassName } from "@/lib/types";

/**
 * Original decorative SVG art for the redesigned chrome. Ported from the
 * static mockup's illustrations.jsx — purely presentational, no game data.
 */

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 67 + 13) % 1200,
  y: (i * 41 + 9) % 300,
  r: (i % 3) + 0.6,
  delay: ((i * 0.37) % 4).toFixed(2),
}));
const STONES = [0, 60, 120, 180, 240, 300];

export function CompassMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.4" />
      <path d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3" strokeWidth="1.1" opacity=".55" />
      <path d="m15.6 8.4-2.7 5.9-5.9 2.7 2.7-5.9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RuneDivider() {
  return (
    <div className="rune-divider">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M12 2 22 12 12 22 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label="Illustrated mountain landscape with a glowing wayshrine beneath twin moons"
    >
      <defs>
        <linearGradient id="wcSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.11 0.02 260)" />
          <stop offset="100%" stopColor="oklch(0.185 0.02 260)" />
        </linearGradient>
        <radialGradient id="wcGlow" cx="50%" cy="100%" r="65%">
          <stop offset="0%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wcBeam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.82 0.13 85)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="640" fill="url(#wcSky)" />
      {STARS.map((s, i) => (
        <circle
          key={i}
          className="hero-star"
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="oklch(0.93 0.01 90)"
          style={{ animationDelay: s.delay + "s" }}
        />
      ))}
      <circle cx="985" cy="118" r="70" fill="oklch(0.9 0.02 90)" opacity="0.07" />
      <circle cx="985" cy="118" r="42" fill="oklch(0.9 0.02 90)" opacity="0.92" />
      <circle cx="885" cy="86" r="18" fill="oklch(0.82 0.13 85)" opacity="0.85" />
      <polygon
        points="0,420 150,300 320,382 460,258 600,358 760,268 900,372 1050,300 1200,398 1200,640 0,640"
        fill="oklch(0.225 0.02 260)"
      />
      <polygon
        points="0,482 200,362 380,442 540,330 720,432 880,342 1050,420 1200,360 1200,640 0,640"
        fill="oklch(0.18 0.02 260)"
      />
      <rect x="555" y="0" width="90" height="640" fill="url(#wcGlow)" opacity="0.55" />
      <polygon
        points="0,560 250,470 470,540 660,452 900,540 1120,462 1200,522 1200,640 0,640"
        fill="oklch(0.145 0.018 260)"
      />
      <g transform="translate(600,558)">
        <rect x="-3.5" y="-190" width="7" height="190" fill="url(#wcBeam)" />
        <ellipse cx="0" cy="4" rx="68" ry="13" fill="oklch(0.08 0.02 260)" opacity="0.55" />
        {STONES.map((a, i) => (
          <rect
            key={i}
            x="-4"
            y="-46"
            width="8"
            height="46"
            rx="2"
            fill="oklch(0.26 0.02 260)"
            stroke="oklch(0.32 0.02 260)"
            strokeWidth="1"
            transform={`rotate(${a}) translate(0,-30)`}
          />
        ))}
        <circle cx="0" cy="-4" r="18" fill="oklch(0.82 0.13 85)" opacity="0.22" />
        <circle cx="0" cy="-4" r="9" fill="oklch(0.82 0.13 85)" />
      </g>
    </svg>
  );
}

const SIGIL_PATHS: Record<string, React.ReactNode> = {
  Nightblade: (
    <>
      <path d="M9 4a8 8 0 1 0 8 12.9A6.5 6.5 0 0 1 9 4Z" />
      <path d="m14.2 9-3 6-1 3 3-1 6-3z" fill="currentColor" stroke="none" opacity=".9" />
    </>
  ),
  Sorcerer: <path d="M13 3 7 13h4l-2 8 8-11h-4z" fill="currentColor" stroke="none" />,
  Templar: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3v3.3M12 17.7V21M3 12h3.3M17.7 12H21M5.8 5.8l2.3 2.3M15.9 15.9l2.3 2.3M18.2 5.8l-2.3 2.3M8.1 15.9l-2.3 2.3" />
    </>
  ),
  Dragonknight: (
    <>
      <path d="M12 3c2.4 2.9 3.5 5.6 3.5 8 0 2.8-1.5 4.9-3.5 6.2-2-1.3-3.5-3.4-3.5-6.2 0-2.4 1.1-5.1 3.5-8Z" />
      <path
        d="M12 12.3c1 1 1.4 1.9 1.4 3 0 1.3-.6 2.4-1.4 3.2-.8-.8-1.4-1.9-1.4-3.2 0-1.1.4-2 1.4-3Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  Warden: (
    <>
      <path d="M12 4c3 2 5 4.9 5 8.3A5 5 0 0 1 7 12.3C7 8.9 9 6 12 4Z" />
      <path d="M12 12.3V20" />
    </>
  ),
  Necromancer: (
    <>
      <path d="M5 15c0-4.4 3-8.3 7-8.8 4 .5 7 4.4 7 8.8" />
      <path d="M6.4 15.4c1.5 1.5 3.4 2.3 5.6 2.3s4.1-.8 5.6-2.3" />
      <circle cx="9.3" cy="13.1" r=".9" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="13.1" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  Arcanist: (
    <>
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 3.6v3M12 17.4v3M3.6 12h3M17.4 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1" />
    </>
  ),
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ClassSigil({ name, className }: { name: ClassName; className?: string }) {
  const label = capitalize(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SIGIL_PATHS[label] ?? SIGIL_PATHS.Templar}
    </svg>
  );
}
