import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/data";
import { setsForZone } from "@/lib/zones";
import { SetsTable } from "./sets-table";

export const metadata: Metadata = { title: "Sets" };

export const revalidate = 300;

export default async function SetsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone: zoneId } = await searchParams;
  const db = await getDb();
  // Optional deep link from /zones — filter to a single zone's drops using the
  // same matcher the zones index uses, so the two views never disagree.
  const zone = zoneId ? db.zones.find((z) => z.id === zoneId) : undefined;
  const sets = zone ? setsForZone(zone, db.sets) : db.sets;

  return (
    <div>
      <span className="font-mono text-xs text-primary">SETS</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        {zone ? `Sets that drop in ${zone.name}` : `Every set, checked against ${db.currentPatch}`}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {zone
          ? `Tracked sets sourced from ${zone.name}, filtered from the full library. Each still carries the patch it last changed in.`
          : "Search the tracked set library. A set flagged for review changed in a recent patch — its listed bonus may be out of date, and every build referencing it gets flagged automatically."}
      </p>
      {zone && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Zone filter · {zone.name}
          </span>
          <Link
            href="/sets"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear filter
          </Link>
          <Link
            href="/zones"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Back to zones
          </Link>
        </div>
      )}
      <div className="mt-6">
        <SetsTable sets={sets} currentPatch={db.currentPatch} />
      </div>
    </div>
  );
}
