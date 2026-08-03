import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { SetsTable } from "./sets-table";

export const metadata: Metadata = { title: "Sets" };

export const revalidate = 300;

export default async function SetsPage() {
  const db = await getDb();

  return (
    <div>
      <span className="font-mono text-xs text-primary">SETS</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        Every set, checked against {db.currentPatch}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Search the tracked set library. A set flagged for review changed in a recent patch — its
        listed bonus may be out of date, and every build referencing it gets flagged automatically.
      </p>
      <div className="mt-6">
        <SetsTable sets={db.sets} currentPatch={db.currentPatch} />
      </div>
    </div>
  );
}
