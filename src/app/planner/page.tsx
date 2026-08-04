import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb } from "@/lib/data";
import { RuneDivider } from "@/components/illustrations";
import { Planner } from "./planner";

export const metadata: Metadata = { title: "Build Planner" };

export default async function PlannerPage() {
  const db = await getDb();

  // Slim the catalog to the fields the planner reads before it crosses the
  // RSC boundary: skill descriptions and morphs are the bulk of the payload
  // and the planner renders neither.
  const liveSets = db.sets.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    source: s.source,
    dlcRequired: s.dlcRequired,
    bonuses: s.bonuses,
    mythicSlot: s.mythicSlot,
    firstSeenPatch: s.firstSeenPatch,
    lastChangedPatch: s.lastChangedPatch,
  }));
  const liveSkills = db.skills.map((s) => ({
    id: s.id,
    name: s.name,
    className: s.className,
    line: s.line,
    lineLabel: s.lineLabel,
    ultimate: s.ultimate,
    passive: s.passive,
    firstSeenPatch: s.firstSeenPatch,
    lastChangedPatch: s.lastChangedPatch,
  }));
  const liveCpStars = db.cpStars.map((s) => ({
    id: s.id,
    name: s.name,
    tree: s.tree,
    slottable: s.slottable,
    effect: s.effect,
    firstSeenPatch: s.firstSeenPatch,
    lastChangedPatch: s.lastChangedPatch,
  }));

  return (
    <div>
      <span className="font-mono text-xs text-primary">PLANNER</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Draft a build, watch its freshness</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Assemble a build and get legality checks, computed stats, and a live freshness preview as
        you go. Share it with a permalink, or fork any published build.
      </p>
      <Suspense>
        <Planner currentPatch={db.currentPatch} liveSets={liveSets} liveSkills={liveSkills} liveCpStars={liveCpStars} />
      </Suspense>
      <div className="py-6">
        <RuneDivider />
      </div>
    </div>
  );
}
