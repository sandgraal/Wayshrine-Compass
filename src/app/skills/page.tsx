import type { Metadata } from "next";
import { db } from "@/lib/data";
import { ALL_CLASSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Skills</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Class and weapon skill lines with patch provenance. With Subclassing, any class line can be
        grafted onto another class (keep at least one native line).
      </p>

      <div className="mt-6 space-y-10">
        {ALL_CLASSES.map((cls) => {
          const classSkills = db.skills.filter((s) => s.className === cls);
          const lines = [...new Set(classSkills.map((s) => s.line))];
          return (
            <section key={cls}>
              <h2 className="mb-3 text-lg font-semibold capitalize">{cls}</h2>
              <div className="grid gap-3 lg:grid-cols-3">
                {lines.map((line) => {
                  const lineSkills = classSkills.filter((s) => s.line === line);
                  return (
                    <div key={line} className="rounded-lg border border-border bg-card p-4">
                      <h3 className="font-medium">{lineSkills[0].lineLabel}</h3>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {lineSkills.map((s) => (
                          <li key={s.id} title={s.description}>
                            <span className={cn(s.ultimate && "text-primary")}>
                              {s.ultimate && "★ "}
                              {s.name}
                            </span>
                            {s.lastChangedPatch === db.currentPatch && (
                              <span className="ml-1.5 rounded-full border border-needs-review/40 bg-needs-review/10 px-1.5 py-0.5 font-mono text-[10px] text-needs-review">
                                changed in {s.lastChangedPatch}
                              </span>
                            )}
                            <span className="block text-xs text-muted-foreground">
                              {s.morphs.map((m) => m.name).join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Weapon &amp; guild lines</h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {[...new Set(db.skills.filter((s) => !s.className).map((s) => s.line))].map((line) => {
              const lineSkills = db.skills.filter((s) => !s.className && s.line === line);
              return (
                <div key={line} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-medium">{lineSkills[0].lineLabel}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {lineSkills.map((s) => (
                      <li key={s.id} title={s.description}>
                        <span className={cn(s.ultimate && "text-primary")}>
                          {s.ultimate && "★ "}
                          {s.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {s.morphs.map((m) => m.name).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
