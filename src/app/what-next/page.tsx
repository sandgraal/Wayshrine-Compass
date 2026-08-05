import type { Metadata } from "next";
import { WhatNextForm } from "./what-next-form";

export const metadata: Metadata = {
  title: "What Next",
  description:
    "Tell us your class, level, and goal and get a short, prioritized list of what to do next in ESO — no addons required, console-safe.",
};

export default function WhatNextPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">What should I do next?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Under a minute to fill in. The recommendations come from a deterministic rules engine over the
        game database — never content you can&apos;t access, never addon advice on console.
      </p>
      <WhatNextForm />
    </div>
  );
}
