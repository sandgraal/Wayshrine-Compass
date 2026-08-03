import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb } from "@/lib/data";
import { RuneDivider } from "@/components/illustrations";
import { Planner } from "./planner";

export const metadata: Metadata = { title: "Build Planner" };

export default async function PlannerPage() {
  const db = await getDb();
  return (
    <div>
      <span className="font-mono text-xs text-primary">PLANNER</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Draft a build, watch its freshness</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Assemble a build and get legality checks, computed stats, and a live freshness preview as
        you go. Share it with a permalink, or fork any published build.
      </p>
      <Suspense>
        <Planner currentPatch={db.currentPatch} liveSets={db.sets} liveSkills={db.skills} />
      </Suspense>
      <div className="py-6">
        <RuneDivider />
      </div>
    </div>
  );
}
