import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GitFork } from "lucide-react";
import { getDb } from "@/lib/data";
import { buildEntityRefs } from "@/lib/entities";
import { fetchRecentIngestRuns, persistenceConfigured } from "@/lib/ingest/persist";
import { builds as seedBuilds } from "@/data/builds";
import { BuildGuidance } from "@/components/build-guidance";
import { FreshnessBadge } from "@/components/freshness-badge";
import { CharacterPortrait, PortraitWash } from "@/components/character-portrait";
import { portraitForBuild } from "@/lib/portraits";
import { ClassSigil, RuneDivider } from "@/components/illustrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { GearSlot, Skill, SkillBar } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  // Build-time params come from the seed dataset; unknown slugs added later in
  // the database render on demand (dynamicParams default).
  return seedBuilds.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const build = db.getBuild(slug);
  return { title: build ? build.name : "Build" };
}

const SLOT_LABEL: Record<GearSlot, string> = {
  head: "Head",
  shoulders: "Shoulders",
  chest: "Chest",
  hands: "Hands",
  waist: "Waist",
  legs: "Legs",
  feet: "Feet",
  necklace: "Necklace",
  ring1: "Ring 1",
  ring2: "Ring 2",
  frontBarWeapon: "Front bar",
  backBarWeapon: "Back bar",
};

function SkillBarGrid({
  title,
  bar,
  skillById,
}: {
  title: string;
  bar: SkillBar;
  skillById: Map<string, Skill>;
}) {
  const skillName = (id: string) => skillById.get(id)?.name ?? id;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="grid grid-cols-6 gap-2">
        {bar.skills.map((id, i) => (
          <div key={i} className="skill-slot" title={skillById.get(id)?.description}>
            {skillName(id)}
          </div>
        ))}
        <div className="skill-slot is-ultimate" title={skillById.get(bar.ultimate)?.description}>
          {skillName(bar.ultimate)}
        </div>
      </div>
    </div>
  );
}

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const build = db.getBuild(slug);
  if (!build) notFound();

  const freshness = db.freshness(build);

  // Evidence for the green banner: when the most recent pipeline run happened,
  // read server-side via the service role. Omitted on seed fallback or read
  // failure; the banner's checked-entity count stands on its own.
  let verifiedEvidenceDate: string | null = null;
  if (freshness.status === "verified" && persistenceConfigured()) {
    try {
      const [run] = await fetchRecentIngestRuns(1);
      if (run) {
        verifiedEvidenceDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(run.ranAt)
        );
      }
    } catch {
      // optional evidence; never fail the page over it
    }
  }
  const portrait = portraitForBuild(build);
  const mundus = db.mundusById.get(build.mundusId);
  const food = db.foodById.get(build.foodId);

  const relatedBuilds = db.builds
    .filter((b) => b.className === build.className && b.id !== build.id)
    .slice(0, 3);

  const cpTotal = (["warfare", "fitness", "craft"] as const).reduce(
    (sum, tree) => sum + build.cp[tree].length,
    0
  );

  return (
    <div>
      <div className="relative isolate mb-8 flex flex-wrap items-start gap-6">
        {portrait && <PortraitWash portrait={portrait} />}
        {portrait ? (
          <CharacterPortrait
            portrait={portrait}
            sizes="(min-width: 640px) 15rem, 60vw"
            priority
            className="aspect-[3/4] w-40 flex-none rounded-xl border border-border shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] sm:w-60"
          >
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-black/75" />
            <div className="absolute inset-x-3 bottom-2.5 flex flex-col">
              <span className="text-sm font-semibold capitalize text-white">
                {portrait.race} {build.className}
              </span>
              <span className="text-xs capitalize text-white/70">
                {build.role} · {build.contentType}
              </span>
            </div>
          </CharacterPortrait>
        ) : (
          <span className="sigil-ring size-14">
            <ClassSigil name={build.className} className="size-7" />
          </span>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{build.name}</h1>
            <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {build.role}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {build.contentType}
            </Badge>
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {build.patchVerified}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Skill lines:{" "}
            {build.subclassLines
              .map((l) => db.skills.find((s) => `${s.className}/${s.line}` === l)?.lineLabel ?? l.split("/")[1])
              .join(" / ")}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/planner?from=${build.slug}`}>
            <GitFork className="size-3.5" /> Fork in planner
          </Link>
        </Button>
      </div>

      {freshness.status === "verified" ? (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-verified/40 bg-verified/10 px-3 py-2 text-xs">
          <span>
            Verified for <span className="font-mono">{db.currentPatch}</span>: all{" "}
            {buildEntityRefs(build).length} entities this build references were checked against the{" "}
            {db.currentPatch} game data, and none have changed since the review
            {verifiedEvidenceDate ? (
              <>
                . Last data check <span className="font-mono">{verifiedEvidenceDate}</span>.
              </>
            ) : (
              "."
            )}
          </span>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-needs-review/40 bg-needs-review/10 px-3 py-2 text-xs">
          {freshness.status === "stale" ? (
            <span>
              Last verified for <span className="font-mono">{freshness.patchVerified}</span>,{" "}
              {freshness.patchesBehind} patches ago. Treat with caution.
            </span>
          ) : (
            <div>
              {freshness.reasons.map((r) => (
                <p key={`${r.entityType}-${r.entityId}`}>{r.summary}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill bars</CardTitle>
              <CardDescription>Front bar and back bar, in slot order.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <SkillBarGrid title="Front bar" bar={build.frontBar} skillById={db.skillById} />
              <SkillBarGrid title="Back bar" bar={build.backBar} skillById={db.skillById} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gear</CardTitle>
              <CardDescription>Gear layout, last reviewed for {build.patchVerified}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Gear layout for {build.name}.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot</TableHead>
                    <TableHead>Set</TableHead>
                    <TableHead>Trait</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {build.gear.map((g) => {
                    const set = db.setById.get(g.setId);
                    return (
                      <TableRow key={g.slot}>
                        <TableCell className="text-muted-foreground">{SLOT_LABEL[g.slot]}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/sets#${g.setId}`} className="text-foreground underline-offset-4 hover:underline">
                            {set?.name ?? g.setId}
                          </Link>
                        </TableCell>
                        <TableCell>{g.trait}</TableCell>
                        <TableCell className="text-muted-foreground">{set?.source}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Champion points</CardTitle>
              <CardDescription>Slotted stars by tree.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tree</TableHead>
                    <TableHead>Champion star</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(["warfare", "fitness", "craft"] as const).flatMap((tree) =>
                    build.cp[tree].map((id, i) => (
                      <TableRow key={id}>
                        {i === 0 ? (
                          <TableCell className="capitalize text-muted-foreground" rowSpan={build.cp[tree].length}>
                            {tree}
                          </TableCell>
                        ) : null}
                        <TableCell className="font-medium" title={db.cpStarById.get(id)?.effect}>
                          {db.cpStarById.get(id)?.name ?? id}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={1}>Slotted total</TableCell>
                    <TableCell className="font-mono">{cpTotal}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guidance</CardTitle>
              <CardDescription>Filtered automatically for your platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <BuildGuidance blocks={build.guidance} />
            </CardContent>
          </Card>

          <details className="group rounded-lg border border-border bg-card">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium marker:text-primary">
              Morphs &amp; alternatives
            </summary>
            <div className="border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <ul className="space-y-1">
                {[
                  ...build.frontBar.skills,
                  build.frontBar.ultimate,
                  ...build.backBar.skills,
                  build.backBar.ultimate,
                ].map((id) => {
                  const s = db.skillById.get(id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <span className="text-foreground">{s.name}</span> &rarr; morphs:{" "}
                      {s.morphs.map((m) => m.name).join(" or ")}
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>

          <details className="group rounded-lg border border-border bg-card">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium marker:text-primary">
              Patch provenance
            </summary>
            <div className="border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <p>
                Last human review: <span className="font-mono text-foreground">{build.patchVerified}</span> by{" "}
                {build.author}. Current game patch:{" "}
                <span className="font-mono text-foreground">{db.currentPatch}</span>.
              </p>
              <p className="mt-1">
                Every set, skill, and CP star above is a database reference with its own change
                history — when a patch touches any of them, this page flags itself automatically.
              </p>
            </div>
          </details>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick facts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize">{build.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Content</span>
                <span className="capitalize">{build.contentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patch verified</span>
                <span className="font-mono">{build.patchVerified}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Mundus stone</span>
                <span className="text-right">{mundus?.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Food</span>
                <span className="text-right">{food?.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={freshness.status !== "verified" ? "border-needs-review/40" : undefined}>
            <CardHeader className="border-b border-border">
              <CardTitle>{db.currentPatch} changes</CardTitle>
              <CardDescription>
                {freshness.reasons.length === 0
                  ? `Nothing in this build moved this patch`
                  : `${freshness.reasons.length} referenced ${freshness.reasons.length === 1 ? "entity" : "entities"} moved`}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {freshness.reasons.length === 0 ? (
                <p>Last reviewed for {build.patchVerified}. Nothing it references has changed since.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {freshness.reasons.map((r) => (
                    <li key={`${r.entityType}-${r.entityId}`}>{r.summary}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {relatedBuilds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related builds</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {relatedBuilds.map((b) => (
                  <Link
                    key={b.id}
                    href={`/builds/${b.slug}`}
                    className="text-foreground no-underline hover:text-primary"
                  >
                    {b.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="py-6">
        <RuneDivider />
      </div>
    </div>
  );
}
