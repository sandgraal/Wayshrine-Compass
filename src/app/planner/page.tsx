import type { Metadata } from "next";
import { Suspense } from "react";
import { Planner } from "./planner";

export const metadata: Metadata = { title: "Build Planner" };

export default function PlannerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Build Planner</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Assemble a build and get legality checks and computed stats as you go. Share it with a
        permalink, or fork any published build.
      </p>
      <Suspense>
        <Planner />
      </Suspense>
    </div>
  );
}
