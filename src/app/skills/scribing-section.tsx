import type { Grimoire, PatchCode, ScribingScript } from "@/lib/types";
import { SCRIPT_SLOTS } from "@/lib/types";
import { entityChangeStatus } from "@/lib/freshness";
import { EntityChangeBadge } from "@/components/entity-change-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SLOT_LABELS = { focus: "Focus", signature: "Signature", affix: "Affix" } as const;

/**
 * Scribing catalog: grimoires with their per-slot script compatibility, and
 * the full script list grouped by slot. Server-rendered; entities carry the
 * same provenance classification as skills above — a badge appears only for
 * an observed change or a post-baseline addition, never for a baseline stamp.
 */
export function ScribingSection({
  grimoires,
  scripts,
  patchOrder,
}: {
  grimoires: Grimoire[];
  scripts: ScribingScript[];
  patchOrder: PatchCode[];
}) {
  if (grimoires.length === 0 && scripts.length === 0) return null;

  const badge = (entity: { firstSeenPatch: PatchCode; lastChangedPatch: PatchCode }) =>
    entityChangeStatus(entity, patchOrder).kind !== "tracked" ? (
      <EntityChangeBadge entity={entity} patchOrder={patchOrder} />
    ) : null;

  return (
    <div className="mt-10">
      <h2 className="mb-1 text-lg font-semibold">Scribing</h2>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        Grimoires are base skills you customize with a Focus, Signature, and Affix script.
        Scribing requires the Gold Road chapter. Grimoires and scripts are patch-tracked like
        every other entity, so a rework shows up here before you re-scribe.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {grimoires.map((g) => (
          <Card key={g.id}>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {g.name}
                {badge(g)}
              </CardTitle>
              <CardDescription>{g.lineLabel} grimoire</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <p className="text-sm text-muted-foreground">{g.description}</p>
              <p className="text-xs text-muted-foreground">
                Accepts {g.focusScripts.length} focus · {g.signatureScripts.length} signature ·{" "}
                {g.affixScripts.length} affix scripts
              </p>
              <p className="text-xs text-muted-foreground">{g.acquisition}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-base font-semibold">Scripts</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        {SCRIPT_SLOTS.map((slot) => {
          const slotScripts = scripts.filter((s) => s.slot === slot);
          return (
            <Card key={slot}>
              <CardHeader className="border-b border-border">
                <CardTitle>{SLOT_LABELS[slot]}</CardTitle>
                <CardDescription>
                  {slotScripts.length} script{slotScripts.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slotScripts.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1 border-b border-border py-2 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{s.name}</span>
                      {badge(s)}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
