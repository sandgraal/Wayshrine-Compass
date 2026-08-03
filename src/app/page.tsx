import Link from "next/link";
import { getDb } from "@/lib/data";
import { FreshnessBadge } from "@/components/freshness-badge";
import { HeroScene, RuneDivider, ClassSigil } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { Build } from "@/lib/types";
import type { Freshness } from "@/lib/freshness";

export const revalidate = 300;

const FEATURED_SLUGS = [
  "nightblade-dps",
  "sorcerer-dps",
  "arcanist-tank",
  "templar-healer",
  "dragonknight-tank",
  "necromancer-tank",
];

function RoleChip({ role }: { role: Build["role"] }) {
  return (
    <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
      {role}
    </span>
  );
}

function BuildCard({ build, freshness, currentPatch }: { build: Build; freshness: Freshness; currentPatch: string }) {
  return (
    <div className="wc-card-hover flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="sigil-ring size-10">
          <ClassSigil name={build.className} className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold leading-tight">{build.name}</h3>
          <p className="text-xs capitalize text-muted-foreground">{build.contentType}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoleChip role={build.role} />
        <FreshnessBadge freshness={freshness} currentPatch={currentPatch} />
      </div>
      <p className="text-sm text-muted-foreground">
        {freshness.status === "needs_review" && freshness.reasons[0]?.summary}
        {freshness.status === "stale" &&
          `Last verified for ${freshness.patchVerified}, ${freshness.patchesBehind} patches ago.`}
        {freshness.status === "verified" &&
          `Verified against ${currentPatch}, ${build.subclassLines.length} skill lines tracked.`}
      </p>
      <Button asChild size="sm" variant="outline" className="mt-auto w-full">
        <Link href={`/builds/${build.slug}`}>Open build</Link>
      </Button>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <span className="font-mono text-xs text-primary">{n}</span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default async function Home() {
  const db = await getDb();

  const withFreshness = db.builds.map((build) => ({ build, freshness: db.freshness(build) }));
  const verifiedCount = withFreshness.filter((b) => b.freshness.status === "verified").length;

  const verifiedExample = withFreshness.find((b) => b.freshness.status === "verified")?.freshness;
  const needsReviewExample = withFreshness.find((b) => b.freshness.status === "needs_review")?.freshness;
  const staleExample = withFreshness.find((b) => b.freshness.status === "stale")?.freshness;

  const featured = FEATURED_SLUGS.map((slug) => db.getBuild(slug))
    .filter((b): b is Build => Boolean(b))
    .map((build) => ({ build, freshness: db.freshness(build) }));

  const changedThisPatch = [
    ...db.sets.filter((s) => s.lastChangedPatch === db.currentPatch).map((s) => ({ name: s.name, kind: "set" as const })),
    ...db.skills.filter((s) => s.lastChangedPatch === db.currentPatch).map((s) => ({ name: s.name, kind: "skill" as const })),
    ...db.cpStars.filter((s) => s.lastChangedPatch === db.currentPatch).map((s) => ({ name: s.name, kind: "CP star" as const })),
  ];

  return (
    <div>
      <section>
        <div className="hero-panel">
          <HeroScene className="absolute inset-0 h-full w-full" />
          <div className="relative z-10 flex flex-col gap-6 px-6 py-16 sm:px-12 sm:py-24">
            <span className="w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              {db.currentPatch} IS LIVE
            </span>
            <h1 className="wc-glow-text max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Every build knows which patch it survived.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Wayshrine Compass tracks class builds, gear sets and champion point trees across
              Tamriel, and flags the moment an update makes one of them obsolete.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/builds">Browse a build</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/patch-tracker">See what changed in {db.currentPatch}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="py-16">
        <RuneDivider />
      </div>

      <section>
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-mono text-xs text-primary">FRESHNESS</span>
          <h2 className="text-2xl font-bold">Know at a glance whether a build still holds up</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every build carries a trust status computed against the current patch — {verifiedCount}{" "}
            of {db.builds.length} builds are verified for {db.currentPatch} right now.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {verifiedExample && <FreshnessBadge freshness={verifiedExample} currentPatch={db.currentPatch} />}
              </CardTitle>
              <CardDescription>
                Reviewed against the current patch. Nothing it depends on has moved.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {needsReviewExample && (
                  <FreshnessBadge freshness={needsReviewExample} currentPatch={db.currentPatch} />
                )}
              </CardTitle>
              <CardDescription>
                Something the build relies on changed recently. Numbers may have shifted.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {staleExample && <FreshnessBadge freshness={staleExample} currentPatch={db.currentPatch} />}
              </CardTitle>
              <CardDescription>
                Unreviewed for two or more updates. Treat every claim as unverified.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <div className="py-16">
        <RuneDivider />
      </div>

      <section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-primary">FEATURED BUILDS</span>
            <h2 className="text-2xl font-bold">A build for every role, kept current</h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/builds">View all {db.builds.length} builds &rarr;</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ build, freshness }) => (
            <BuildCard key={build.id} build={build} freshness={freshness} currentPatch={db.currentPatch} />
          ))}
        </div>
      </section>

      <div className="py-16">
        <RuneDivider />
      </div>

      <section>
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-mono text-xs text-primary">HOW IT WORKS</span>
          <h2 className="text-2xl font-bold">Patch tracking, without the guesswork</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard
            n="01"
            title="Track"
            body="Every build is linked to the exact skills, sets and champion points it depends on."
          />
          <StepCard
            n="02"
            title="Detect"
            body="When an update changes one of those entities, the build's freshness status updates automatically."
          />
          <StepCard
            n="03"
            title="Alert"
            body="Open any build and see exactly what moved, with console-safe guidance where a PC addon isn't an option."
          />
        </div>
      </section>

      <div className="py-16">
        <RuneDivider />
      </div>

      <section className="pb-4">
        <Card className="border-primary/20">
          <CardHeader className="border-b border-border">
            <CardTitle>{db.currentPatch} changes</CardTitle>
            <CardDescription>
              {changedThisPatch.length} {changedThisPatch.length === 1 ? "entity" : "entities"} referenced by
              tracked builds moved this patch
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {changedThisPatch.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                {changedThisPatch.map((c) => (
                  <li key={`${c.kind}-${c.name}`}>
                    {c.name} <span className="text-xs uppercase tracking-wide">({c.kind})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Nothing tracked moved in {db.currentPatch} yet.</p>
            )}
          </CardContent>
          <CardFooter className="border-t border-border">
            <Button asChild size="sm" variant="ghost">
              <Link href="/patch-tracker">Review the full patch tracker</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
