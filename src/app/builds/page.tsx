import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { ALL_CLASSES, type ClassName } from "@/lib/types";
import { FreshnessBadge } from "@/components/freshness-badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Builds" };

const ROLES = ["dps", "tank", "healer"] as const;
const CONTENT = ["trial", "dungeon", "leveling"] as const;

export default async function BuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; role?: string; content?: string }>;
}) {
  const db = await getDb();
  const params = await searchParams;
  const cls = ALL_CLASSES.includes(params.class as ClassName) ? (params.class as ClassName) : undefined;
  const role = ROLES.includes(params.role as (typeof ROLES)[number]) ? params.role : undefined;
  const content = CONTENT.includes(params.content as (typeof CONTENT)[number]) ? params.content : undefined;

  const filtered = db.builds.filter(
    (b) =>
      (!cls || b.className === cls) &&
      (!role || b.role === role) &&
      (!content || b.contentType === content)
  );

  const filterLink = (patch: Record<string, string | undefined>) => {
    const next = { class: cls, role, content, ...patch };
    const qs = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return qs ? `/builds?${qs}` : "/builds";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Builds</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every build carries a patch badge. Amber means the diff engine found a change that may affect
        it; the build page names the exact entity.
      </p>

      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">Class</span>
          <FilterChip href={filterLink({ class: undefined })} active={!cls} label="All" />
          {ALL_CLASSES.map((c) => (
            <FilterChip key={c} href={filterLink({ class: c })} active={cls === c} label={c} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">Role</span>
          <FilterChip href={filterLink({ role: undefined })} active={!role} label="All" />
          {ROLES.map((r) => (
            <FilterChip key={r} href={filterLink({ role: r })} active={role === r} label={r} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">Content</span>
          <FilterChip href={filterLink({ content: undefined })} active={!content} label="All" />
          {CONTENT.map((c) => (
            <FilterChip key={c} href={filterLink({ content: c })} active={content === c} label={c} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((build) => {
          const freshness = db.freshness(build);
          return (
            <Link
              key={build.id}
              href={`/builds/${build.slug}`}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{build.name}</h2>
                <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
              </div>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {build.contentType} · {build.role}
                {build.subclassLines.some((l) => !l.startsWith(build.className)) && " · subclassed"}
              </p>
              {freshness.status === "needs_review" && (
                <p className="mt-2 line-clamp-2 text-xs text-needs-review">
                  {freshness.reasons[0]?.summary}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs capitalize transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
