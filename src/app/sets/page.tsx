import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sets" };

export const revalidate = 300;

export default async function SetsPage() {
  const db = await getDb();
  const grouped = new Map<string, typeof db.sets>();
  for (const set of db.sets) {
    const list = grouped.get(set.type) ?? [];
    list.push(set);
    grouped.set(set.type, list);
  }
  const order = ["trial", "dungeon", "monster", "mythic", "crafted", "overland", "arena", "pvp"];

  return (
    <div>
      <h1 className="text-2xl font-bold">Gear Sets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every set carries patch provenance. A set changed in the current patch is marked — and every
        build referencing it gets flagged automatically.
      </p>

      <div className="mt-6 space-y-8">
        {order
          .filter((t) => grouped.has(t))
          .map((type) => (
            <section key={type}>
              <h2 className="mb-3 text-lg font-semibold capitalize">{type} sets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped.get(type)!.map((set) => {
                  const changedThisPatch = set.lastChangedPatch === db.currentPatch;
                  return (
                    <div
                      key={set.id}
                      id={set.id}
                      className={cn(
                        "rounded-lg border bg-card p-4 scroll-mt-20",
                        changedThisPatch ? "border-needs-review/50" : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{set.name}</h3>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                            changedThisPatch
                              ? "border-needs-review/40 bg-needs-review/10 text-needs-review"
                              : "border-border text-muted-foreground"
                          )}
                          title={`Last changed in ${set.lastChangedPatch}`}
                        >
                          {changedThisPatch ? `changed in ${set.lastChangedPatch}` : set.lastChangedPatch}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{set.source}</p>
                      <ul className="mt-2 space-y-0.5 text-xs">
                        {set.bonuses.map((b) => (
                          <li key={b.pieces} className="text-muted-foreground">
                            <span className="font-mono text-foreground">{b.pieces}pc</span> {b.effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
