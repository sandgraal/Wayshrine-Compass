import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, GitFork } from "lucide-react";
import { getDb } from "@/lib/data";
import { builds as seedBuilds } from "@/data/builds";
import { BuildGuidance } from "@/components/build-guidance";
import { FreshnessBadge } from "@/components/freshness-badge";
import type { GearSlot } from "@/lib/types";

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

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const build = db.getBuild(slug);
  if (!build) notFound();

  const freshness = db.freshness(build);
  const mundus = db.mundusById.get(build.mundusId);
  const food = db.foodById.get(build.foodId);

  const skillName = (id: string) => db.skillById.get(id)?.name ?? id;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header: identity + trust badge. Kept to two compact rows so the gear
          table stays above the fold at 1080p and on a 390px viewport. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold sm:text-2xl">{build.name}</h1>
          <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
        </div>
        <Link
          href={`/planner?from=${build.slug}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
        >
          <GitFork className="size-3.5" /> Fork in planner
        </Link>
      </div>
      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
        {build.contentType} · {build.role} ·{" "}
        {build.subclassLines
          .map((l) => db.skills.find((s) => `${s.className}/${s.line}` === l)?.lineLabel ?? l.split("/")[1])
          .join(" / ")}
      </p>

      {freshness.status !== "verified" && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-needs-review/40 bg-needs-review/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-needs-review" />
          <div>
            {freshness.status === "stale" ? (
              <span>
                Last verified for <span className="font-mono">{freshness.patchVerified}</span>,{" "}
                {freshness.patchesBehind} patches ago. Treat with caution.
              </span>
            ) : (
              freshness.reasons.map((r) => <p key={`${r.entityType}-${r.entityId}`}>{r.summary}</p>)
            )}
          </div>
        </div>
      )}

      {/* ---- Answer first: gear table ---- */}
      <section className="mt-4">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[340px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-1.5 font-medium">Slot</th>
                <th className="px-3 py-1.5 font-medium">Set</th>
                <th className="px-3 py-1.5 font-medium">Trait</th>
                <th className="hidden px-3 py-1.5 font-medium sm:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {build.gear.map((g) => {
                const set = db.setById.get(g.setId);
                return (
                  <tr key={g.slot} className="border-b border-border/50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-1 text-muted-foreground">{SLOT_LABEL[g.slot]}</td>
                    <td className="whitespace-nowrap px-3 py-1 font-medium">
                      <Link href={`/sets#${g.setId}`} className="underline-offset-4 hover:underline">
                        {set?.name ?? g.setId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1">{g.trait}</td>
                    <td className="hidden px-3 py-1 text-xs text-muted-foreground sm:table-cell">{set?.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Bars, CP, mundus, food ---- */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Front bar", build.frontBar],
            ["Back bar", build.backBar],
          ] as const
        ).map(([label, bar]) => (
          <div key={label} className="rounded-lg border border-border bg-card p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {bar.skills.map((id, i) => (
                <li
                  key={id}
                  className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs"
                  title={db.skillById.get(id)?.description}
                >
                  {i + 1}. {skillName(id)}
                </li>
              ))}
              <li className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Ult: {skillName(bar.ultimate)}
              </li>
            </ol>
          </div>
        ))}
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3 text-sm sm:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mundus · Food</h2>
          <p className="mt-1.5 font-medium">{mundus?.name}</p>
          <p className="text-xs text-muted-foreground">{mundus?.effect}</p>
          <p className="mt-2 font-medium">{food?.name}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Champion Points (slottables)
          </h2>
          <div className="mt-1.5 grid gap-2 text-xs sm:grid-cols-3">
            {(["warfare", "fitness", "craft"] as const).map((tree) => (
              <div key={tree}>
                <p className="mb-1 font-medium capitalize text-muted-foreground">{tree}</p>
                <ul className="space-y-0.5">
                  {build.cp[tree].map((id) => (
                    <li key={id} title={db.cpStarById.get(id)?.effect}>
                      {db.cpStarById.get(id)?.name ?? id}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Everything else: collapsed ---- */}
      <section className="mt-6 space-y-2">
        <BuildGuidance blocks={build.guidance} />
        <details className="group rounded-lg border border-border bg-card">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium marker:text-primary">
            Morphs &amp; alternatives
          </summary>
          <div className="border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
            <ul className="space-y-1">
              {[...build.frontBar.skills, build.frontBar.ultimate, ...build.backBar.skills, build.backBar.ultimate].map(
                (id) => {
                  const s = db.skillById.get(id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <span className="text-foreground">{s.name}</span> → morphs:{" "}
                      {s.morphs.map((m) => m.name).join(" or ")}
                    </li>
                  );
                }
              )}
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
              {build.author}. Current game patch: <span className="font-mono text-foreground">{db.currentPatch}</span>.
            </p>
            <p className="mt-1">
              Every set, skill, and CP star above is a database reference with its own change history — when a
              patch touches any of them, this page flags itself automatically.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}
