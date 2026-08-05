import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/data";
import { CHANGELOG } from "@/data/changelog";
import { RuneDivider } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who makes Wayshrine Compass, how its patch-freshness is computed, and why every icon on the site is drawn rather than ripped from the game.",
};

export const revalidate = 300;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AboutPage() {
  const db = await getDb();

  return (
    <div className="max-w-2xl">
      <span className="font-mono text-xs text-primary">ABOUT</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">A patch-honest ESO companion</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Wayshrine Compass is built and maintained by <strong className="text-foreground">Sandgraal</strong>,
        an Elder Scrolls Online player who got tired of build guides that never say when they
        were last true. It is a one-person project, not a content network.
      </p>

      <Section title="What it's for">
        <p className="text-sm text-muted-foreground">
          Every build, set, and skill here carries a patch stamp, and when an update changes
          something a build relies on, the build flags itself and names the exact entity that
          moved. The goal is simple: you should never have to guess whether what you&apos;re
          reading still applies to the game you&apos;re playing.
        </p>
      </Section>

      <Section title="How freshness is computed">
        <p className="text-sm text-muted-foreground">
          Freshness is derived from provenance, not a button someone remembers to press. The
          data comes from the community datamining at{" "}
          <a
            href="https://esolog.uesp.net"
            className="text-primary underline underline-offset-2"
            rel="noreferrer"
            target="_blank"
          >
            UESP&apos;s ESO log project
          </a>{" "}
          (CC-BY-SA); a daily job diffs it against the last known state and stamps each entity
          with the patch it last actually changed in. A green &ldquo;verified&rdquo; badge is a
          claim I can show my work for — the{" "}
          <Link href="/patch-tracker" className="text-primary underline underline-offset-2">
            patch tracker
          </Link>{" "}
          publishes every pipeline run and its diff, and{" "}
          <a href="/api/ingest" className="text-primary underline underline-offset-2">
            /api/ingest
          </a>{" "}
          returns the same counts as machine-readable JSON. The site is currently tracking{" "}
          <span className="font-mono">{db.currentPatch}</span> (data source:{" "}
          <span className="font-mono">{db.source}</span>).
        </p>
      </Section>

      <Section title="The art is ours">
        <p className="text-sm text-muted-foreground">
          Every icon, sigil, and portrait on this site is drawn for it. Nothing is extracted
          from the game&apos;s files — partly because reusing ZeniMax&apos;s assets isn&apos;t a
          right I have, and partly because original art can encode things the in-game icons
          don&apos;t, like a set&apos;s source or a skill line&apos;s role. When a piece of art is
          missing, the page falls back to text; the words always carry the meaning.
        </p>
      </Section>

      <Section title="If something's wrong">
        <p className="text-sm text-muted-foreground">
          I&apos;d rather be corrected than confidently wrong. If a value looks off, a build reads
          stale, or the data disagrees with the game, open an issue on{" "}
          <a
            href="https://github.com/sandgraal/Wayshrine-Compass/issues"
            className="text-primary underline underline-offset-2"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          . Always verify in-game before spending gold or transmute crystals.
        </p>
      </Section>

      <Section title="Not affiliated with ZeniMax">
        <p className="text-sm text-muted-foreground">
          Wayshrine Compass is an unofficial, fan-made tool. It is not affiliated with, endorsed,
          sponsored, or specifically approved by ZeniMax Online Studios, Bethesda Softworks, or
          their affiliates. All game trademarks and copyrights belong to their respective owners.
          All written guidance here is original.
        </p>
      </Section>

      <div className="py-12">
        <RuneDivider />
      </div>

      <section className="flex flex-col gap-2">
        <span className="font-mono text-xs text-primary">MAINTAINER NOTES</span>
        <h2 className="text-xl font-semibold">What&apos;s changed, in my words</h2>
        <p className="text-sm text-muted-foreground">
          The human record of what changed about the site — separate from the automated pipeline
          feed on the patch tracker.
        </p>
        <ol className="mt-4 flex flex-col gap-5">
          {CHANGELOG.map((entry) => (
            <li key={`${entry.date}-${entry.title}`} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-semibold">{entry.title}</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {DATE_FORMAT.format(new Date(entry.date))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{entry.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
