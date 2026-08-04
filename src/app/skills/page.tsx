import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { SkillsExplorer } from "./skills-explorer";
import { ScribingSection } from "./scribing-section";

export const metadata: Metadata = { title: "Skills" };

export const revalidate = 300;

export default async function SkillsPage() {
  const db = await getDb();
  return (
    <div>
      <span className="font-mono text-xs text-primary">SKILLS</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Class skill lines, patch-annotated</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Browse each class kit. With Subclassing, any class line can be grafted onto another class
        (keep at least one native line). Skills that moved in {db.currentPatch} carry a change
        note, so you know before you slot them.
      </p>
      <div className="mt-6">
        <SkillsExplorer skills={db.skills} currentPatch={db.currentPatch} patchOrder={db.patchOrder} />
      </div>
      <ScribingSection grimoires={db.grimoires} scripts={db.scripts} patchOrder={db.patchOrder} />
    </div>
  );
}
