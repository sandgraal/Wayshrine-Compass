import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/lib/data";
import { RuneDivider } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  groupZonesByTier,
  setsForZone,
  zoneAccess,
  type ZoneTier,
} from "@/lib/zones";
import type { GearSet, Zone } from "@/lib/types";

export const metadata: Metadata = {
  title: "Zones",
  description:
    "Every overland zone in Tamriel — how each is unlocked, whether it scales to your level, and which tracked sets drop inside.",
};

export const revalidate = 300;

/**
 * Original, flavour-forward one-liners keyed by zone id. Presentational copy
 * lives here, not in the dataset. A zone without an entry simply renders no
 * blurb.
 */
const ZONE_BLURBS: Record<string, string> = {
  "zone-auridon":
    "A guarded Altmer coast of harbour towns and quiet Veiled Heritance plots — the Aldmeri Dominion's gentle first steps.",
  "zone-glenumbra":
    "Windswept Breton moors on the Daggerfall Covenant's western edge, troubled by werewolves and a stirring lich.",
  "zone-stonefalls":
    "Ashlands and lava flows where Ebonheart Pact allies hold the Dunmer border against invasion.",
  "zone-cyrodiil":
    "The Imperial heartland given over to open war — three alliances fight for keeps, Elder Scrolls, and the throne.",
  "zone-vvardenfell":
    "The ashen isle beneath Red Mountain, its temple city shadowed by a failing god and a falling moon.",
  "zone-summerset":
    "The high elves' long-closed homeland, opened at last — crystal spires, Psijic secrets, and a hidden rot beneath.",
  "zone-northern-elsweyr":
    "Sun-baked Khajiit drylands around ruined Rimmen, where dragons tear free across the sands.",
  "zone-blackwood":
    "Argonian marsh and Imperial estate along the Niben, pulled into a bargain with Mehrunes Dagon.",
  "zone-high-isle":
    "Cliffs, vineyards, and sea caves host a fragile peace summit — and knightly orders with buried secrets.",
  "zone-galen":
    "A rain-drenched druid isle west of the Systres, its old stones warded by the Firesong circle.",
  "zone-telvanni-peninsula":
    "Towering mushroom coast beside the necropolis of Necrom, shadowed by a threat to memory itself.",
  "zone-west-weald":
    "Golden Colovian borderland and Ayleid ruin near Skingrad, where a Recollection cult wakes old magic.",
  "zone-solstice":
    "A sun-warm island drawn into the Worm Cult's schemes — home base of the evolving seasonal story.",
};

const TIER_SECTION: Record<ZoneTier, { eyebrow: string; heading: string; blurb: string }> = {
  "Base game": {
    eyebrow: "BASE GAME",
    heading: "Included for everyone",
    blurb: "Every account can travel here from the very first day — no purchase required.",
  },
  Chapter: {
    eyebrow: "CHAPTERS",
    heading: "Annual chapter expansions",
    blurb:
      "Previously released Chapters are included while ESO Plus is active, or can be bought separately to keep.",
  },
  DLC: {
    eyebrow: "DLC",
    heading: "Game-pack DLC",
    blurb:
      "Smaller content packs. An active ESO Plus membership includes them, or buy them outright with crowns.",
  },
  Season: {
    eyebrow: "SEASONS",
    heading: "Seasonal content",
    blurb:
      "The rolling seasonal storyline. Play along with ESO Plus, or purchase a season to keep it for good.",
  },
};

function TierBadge({ tier }: { tier: ZoneTier }) {
  const isPremium = tier !== "Base game";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        isPremium
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-secondary text-muted-foreground"
      )}
    >
      {tier}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function ZoneCard({ zone, sets }: { zone: Zone; sets: GearSet[] }) {
  const access = zoneAccess(zone);
  const blurb = ZONE_BLURBS[zone.id];
  const shown = sets.slice(0, 6);
  const remainder = sets.length - shown.length;

  return (
    <article className="wc-card-hover flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold leading-tight">{zone.name}</h3>
          {access.packName && <p className="text-xs text-primary">{access.packName}</p>}
        </div>
        <TierBadge tier={access.tier} />
      </div>

      {blurb && <p className="text-sm text-muted-foreground">{blurb}</p>}
      <p className="text-xs text-muted-foreground">{access.note}</p>

      {zone.levelScaled && (
        <div className="flex flex-wrap gap-1.5">
          <Chip>Scales to your level</Chip>
        </div>
      )}

      {sets.length > 0 ? (
        <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-3">
          <p className="text-xs font-medium text-foreground">
            {sets.length} tracked {sets.length === 1 ? "set" : "sets"} drop here
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((s) => (
              <li key={s.id}>
                <Chip>{s.name}</Chip>
              </li>
            ))}
            {remainder > 0 && (
              <li>
                <Chip>+{remainder} more</Chip>
              </li>
            )}
          </ul>
          <Button asChild size="sm" variant="outline" className="mt-1 w-full">
            {/* Whole label kept in one string literal — Turbopack drops the space
                at a JSX expression/text boundary (see CLAUDE.md gotchas). */}
            <Link href={`/sets?zone=${zone.id}`}>
              {sets.length === 1
                ? "View the set in the library →"
                : "View these sets in the library →"}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="mt-auto border-t border-border/60 pt-3 text-xs text-muted-foreground/80">
          No tracked sets catalogued from this zone yet — the library covers a slice of the world
          for now.
        </p>
      )}
    </article>
  );
}

export default async function ZonesPage() {
  const db = await getDb();
  const groups = groupZonesByTier(db.zones);

  return (
    <div>
      {/* Decorative hero. The scene is imagery-only (empty alt, aria-hidden); the
          eyebrow + heading + intro below carry the meaning for assistive tech.
          No animation, so there's nothing for prefers-reduced-motion to gate. */}
      <section>
        <div className="hero-panel">
          <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
            <Image
              src="/zones/hero.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/92 via-background/55 to-background/20" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-background/85" />
          </div>
          <div className="relative z-10 flex flex-col gap-4 px-6 py-14 sm:px-10 sm:py-20">
            <span className="font-mono text-xs text-primary">ZONES</span>
            <h1 className="wc-glow-text max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              Every zone in Tamriel, and how to reach it
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              From the starter shores of the three alliances to the newest chapter isles — what each
              zone costs to enter, whether it scales to your level, and which tracked sets drop
              inside before you set a course.
            </p>
          </div>
        </div>
      </section>

      {groups.map((group, i) => {
        const section = TIER_SECTION[group.tier];
        return (
          <div key={group.tier}>
            <div className="py-12">
              <RuneDivider />
            </div>
            <section>
              <div className="mb-6 flex flex-col gap-1">
                <span className="font-mono text-xs text-primary">{section.eyebrow}</span>
                <h2 className="text-xl font-bold sm:text-2xl">{section.heading}</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">{section.blurb}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} sets={setsForZone(zone, db.sets)} />
                ))}
              </div>
            </section>
            {i === groups.length - 1 && (
              <p className="mt-12 max-w-2xl text-xs text-muted-foreground/80">
                Access details reflect how content is sold at {db.currentPatch}. Set coverage grows
                as the tracked catalogue expands.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
