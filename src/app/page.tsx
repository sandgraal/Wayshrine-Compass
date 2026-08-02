import Link from "next/link";
import { ArrowRight, Compass, Diff, ShieldCheck } from "lucide-react";
import { db } from "@/lib/data";
import { FreshnessBadge } from "@/components/freshness-badge";

export default function Home() {
  const withFreshness = db.builds.map((b) => ({ build: b, freshness: db.freshness(b) }));
  const verified = withFreshness.filter((b) => b.freshness.status === "verified").length;
  const flagged = withFreshness.filter((b) => b.freshness.status === "needs_review");
  const featured = withFreshness.filter((b) => b.build.contentType === "trial" && b.build.role === "dps").slice(0, 3);

  return (
    <div className="space-y-14">
      <section className="pt-6 text-center">
        <p className="mx-auto mb-3 inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          Current patch: <span className="font-mono text-primary">{db.currentPatch}</span> · Season 1
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          ESO builds that <span className="text-primary">prove</span>
          {" they're current"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Every build is backed by a patch-versioned database. When a patch changes anything a build
          references, the build is flagged automatically — and tells you exactly what changed.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/what-next"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            What should I do next? <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/builds"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Browse builds
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <ShieldCheck className="mb-2 size-5 text-verified" />
          <h2 className="font-semibold">Never stale — and we prove it</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {verified} of {db.builds.length} builds verified for {db.currentPatch}.{" "}
            {flagged.length > 0 && `${flagged.length} flagged for review by the patch-diff engine.`}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Diff className="mb-2 size-5 text-needs-review" />
          <h2 className="font-semibold">Answer first</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gear, skill bars, and CP are the first thing on every build page. Prose is collapsed and optional.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Compass className="mb-2 size-5 text-primary" />
          <h2 className="font-semibold">Personalized next actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us your platform, class, and goal — get a ranked list of what to do next, filtered to
            content you can actually access.
          </p>
        </div>
      </section>

      {flagged.length > 0 && (
        <section className="rounded-lg border border-needs-review/40 bg-needs-review/5 p-5">
          <h2 className="font-semibold text-needs-review">Flagged by the diff engine this patch</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {flagged.map(({ build, freshness }) => (
              <li key={build.id}>
                <Link href={`/builds/${build.slug}`} className="font-medium underline-offset-4 hover:underline">
                  {build.name}
                </Link>{" "}
                <span className="text-muted-foreground">— {freshness.reasons[0]?.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Featured builds</h2>
          <Link href="/builds" className="text-sm text-primary underline-offset-4 hover:underline">
            All {db.builds.length} builds →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {featured.map(({ build, freshness }) => (
            <Link
              key={build.id}
              href={`/builds/${build.slug}`}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
              <h3 className="mt-3 font-semibold">{build.name}</h3>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {build.contentType} · {build.role}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
