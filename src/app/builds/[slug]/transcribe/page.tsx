import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { builds as seedBuilds } from "@/data/builds";
import { GEAR_SLOTS, type GearSlot, type SkillBar } from "@/lib/types";

/**
 * Console transcription sheet. PC players import a build via an addon string;
 * console players have no such thing — they must read a build and reproduce it
 * in-game by hand, usually from a second screen. This view is built for that:
 * one linear column, large type, every trait/enchant/name spelled out, no
 * hover-only tooltips and no collapsibles. It references entities only, so it
 * carries zero addon-dependent guidance by construction.
 */

export const revalidate = 300;

export async function generateStaticParams() {
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
  return {
    title: build ? `Transcribe: ${build.name}` : "Transcribe build",
    description: build
      ? `A large-type, print-friendly sheet for reproducing ${build.name} in-game by hand — for console players with no import string.`
      : undefined,
  };
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
  frontBarWeapon: "Front bar weapon",
  backBarWeapon: "Back bar weapon",
};

/** A numbered step block in the linear sheet. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="flex items-baseline gap-3 text-xl font-semibold">
        <span className="font-mono text-base text-primary transcribe-accent">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function TranscribePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const build = db.getBuild(slug);
  if (!build) notFound();

  const mundus = db.mundusById.get(build.mundusId);
  const food = db.foodById.get(build.foodId);
  const gearBySlot = new Map(build.gear.map((g) => [g.slot, g]));

  const lineLabels = build.subclassLines.map(
    (l) => db.skills.find((s) => `${s.className}/${s.line}` === l)?.lineLabel ?? l.split("/")[1]
  );

  const barLine = (bar: SkillBar) =>
    [...bar.skills, bar.ultimate].map((id) => db.skillById.get(id)?.name ?? id);

  return (
    <div className="transcribe-sheet mx-auto max-w-2xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/builds/${build.slug}`}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← Back to {build.name}
        </Link>
        <span className="text-xs text-muted-foreground">
          Use your browser&apos;s Print to save a PDF.
        </span>
      </div>

      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs text-primary transcribe-accent">TRANSCRIPTION SHEET</span>
        <h1 className="text-3xl font-bold">{build.name}</h1>
        <p className="text-muted-foreground">
          <span className="capitalize">{build.className}</span> · <span className="capitalize">{build.role}</span> ·{" "}
          <span className="capitalize">{build.contentType}</span> · verified for{" "}
          <span className="font-mono">{build.patchVerified}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Skill lines: {lineLabels.join(" / ")}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed sm:text-base">
        <Step n={1} title="Gear">
          <ol className="flex flex-col gap-2.5">
            {GEAR_SLOTS.map((slot) => {
              const g = gearBySlot.get(slot);
              const set = g ? db.setById.get(g.setId) : undefined;
              return (
                <li key={slot} className="flex flex-col">
                  <span className="text-sm text-muted-foreground">{SLOT_LABEL[slot]}</span>
                  {g ? (
                    <span>
                      <span className="font-semibold">{set?.name ?? g.setId}</span>
                      {" — "}
                      {g.trait} trait
                      {g.weight ? `, ${g.weight} armor` : ""}
                      {g.enchant ? `, ${g.enchant} glyph` : ""}
                      {set?.source ? (
                        <span className="text-muted-foreground"> · from {set.source}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">(empty)</span>
                  )}
                </li>
              );
            })}
          </ol>
        </Step>

        <Step n={2} title="Mundus & consumable">
          <ul className="flex flex-col gap-1.5">
            <li>
              <span className="font-semibold">Mundus:</span> {mundus?.name ?? build.mundusId}
              {mundus?.effect ? <span className="text-muted-foreground"> — {mundus.effect}</span> : null}
            </li>
            <li>
              <span className="font-semibold">Food/drink:</span> {food?.name ?? build.foodId}
              {food?.effect ? <span className="text-muted-foreground"> — {food.effect}</span> : null}
            </li>
          </ul>
        </Step>

        <Step n={3} title="Front bar">
          <ol className="flex flex-col gap-1.5">
            {barLine(build.frontBar).map((name, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-16 shrink-0 font-mono text-sm text-muted-foreground">
                  {i < 5 ? `Slot ${i + 1}` : "Ult"}
                </span>
                <span className="font-medium">{name}</span>
              </li>
            ))}
          </ol>
        </Step>

        <Step n={4} title="Back bar">
          <ol className="flex flex-col gap-1.5">
            {barLine(build.backBar).map((name, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-16 shrink-0 font-mono text-sm text-muted-foreground">
                  {i < 5 ? `Slot ${i + 1}` : "Ult"}
                </span>
                <span className="font-medium">{name}</span>
              </li>
            ))}
          </ol>
        </Step>

        <Step n={5} title="Champion points">
          <div className="flex flex-col gap-3">
            {(["warfare", "fitness", "craft"] as const).map((tree) => (
              <div key={tree}>
                <span className="text-sm capitalize text-muted-foreground">{tree}</span>
                {build.cp[tree].length > 0 ? (
                  <ol className="mt-0.5 flex flex-col gap-0.5">
                    {build.cp[tree].map((id) => (
                      <li key={id} className="font-medium">
                        {db.cpStarById.get(id)?.name ?? id}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">(none slotted)</p>
                )}
              </div>
            ))}
          </div>
        </Step>
      </div>
    </div>
  );
}
