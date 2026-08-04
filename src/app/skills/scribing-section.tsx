import type { Grimoire, ScribingScript } from "@/lib/types";
import { SCRIPT_SLOTS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SLOT_LABELS = { focus: "Focus", signature: "Signature", affix: "Affix" } as const;

function ChangedBadge({ patch }: { patch: string }) {
  return (
    <Badge variant="outline" className="border-needs-review/40 bg-needs-review/15 text-needs-review">
      Changed in {patch}
    </Badge>
  );
}

/**
 * Scribing catalog: grimoires with their per-slot script compatibility, and
 * the full script list grouped by slot. Server-rendered; entities changed in
 * the current patch carry the same amber badge as skills above.
 */
export function ScribingSection({
  grimoires,
  scripts,
  currentPatch,
}: {
  grimoires: Grimoire[];
  scripts: ScribingScript[];
  currentPatch: string;
}) {
  if (grimoires.length === 0 && scripts.length === 0) return null;

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
                {g.lastChangedPatch === currentPatch && <ChangedBadge patch={currentPatch} />}
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
                      {s.lastChangedPatch === currentPatch && <ChangedBadge patch={currentPatch} />}
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
