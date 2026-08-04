import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/data";
import { ALL_CLASSES, type ClassName } from "@/lib/types";
import { FreshnessBadge } from "@/components/freshness-badge";
import { CharacterPortrait } from "@/components/character-portrait";
import { ClassSigil } from "@/components/illustrations";
import { portraitForBuild } from "@/lib/portraits";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Builds" };

export const revalidate = 300;

const ROLES = ["dps", "tank", "healer"] as const;
const CONTENT = ["trial", "dungeon", "leveling"] as const;
const FRESHNESS = ["verified", "needs_review", "stale"] as const;
const FRESHNESS_LABEL: Record<(typeof FRESHNESS)[number], string> = {
  verified: "Verified",
  needs_review: "Needs review",
  stale: "Stale",
};

export default async function BuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; role?: string; content?: string; freshness?: string }>;
}) {
  const db = await getDb();
  const params = await searchParams;
  const cls = ALL_CLASSES.includes(params.class as ClassName) ? (params.class as ClassName) : undefined;
  const role = ROLES.includes(params.role as (typeof ROLES)[number]) ? params.role : undefined;
  const content = CONTENT.includes(params.content as (typeof CONTENT)[number]) ? params.content : undefined;
  const freshness = FRESHNESS.includes(params.freshness as (typeof FRESHNESS)[number])
    ? (params.freshness as (typeof FRESHNESS)[number])
    : undefined;

  const filtered = db.builds.filter(
    (b) =>
      (!cls || b.className === cls) &&
      (!role || b.role === role) &&
      (!content || b.contentType === content) &&
      (!freshness || db.freshness(b).status === freshness)
  );

  const filterLink = (patch: Record<string, string | undefined>) => {
    const next = { class: cls, role, content, freshness, ...patch };
    const qs = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return qs ? `/builds?${qs}` : "/builds";
  };

  return (
    <div>
      <span className="font-mono text-xs text-primary">BUILDS</span>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Every tracked build, checked against {db.currentPatch}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
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
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">Freshness</span>
          <FilterChip href={filterLink({ freshness: undefined })} active={!freshness} label="All" />
          {FRESHNESS.map((f) => (
            <FilterChip key={f} href={filterLink({ freshness: f })} active={freshness === f} label={FRESHNESS_LABEL[f]} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((build) => {
          const freshness = db.freshness(build);
          const portrait = portraitForBuild(build);
          return (
            <Link
              key={build.id}
              href={`/builds/${build.slug}`}
              className="wc-card-hover flex flex-col overflow-hidden rounded-xl border border-border bg-card no-underline"
            >
              {portrait && (
                <CharacterPortrait
                  portrait={portrait}
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
                  objectPosition="center 12%"
                  className="h-52 border-b border-border/60"
                >
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-transparent to-card" />
                </CharacterPortrait>
              )}
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="sigil-ring size-10">
                    <ClassSigil name={build.className} className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold leading-tight text-foreground">{build.name}</h2>
                    <p className="text-xs capitalize text-muted-foreground">
                      {build.contentType}
                      {build.subclassLines.some((l) => !l.startsWith(build.className)) && " · subclassed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {build.role}
                  </span>
                  <FreshnessBadge freshness={freshness} currentPatch={db.currentPatch} />
                </div>
                {freshness.status === "needs_review" && (
                  <p className="line-clamp-2 text-xs text-needs-review">{freshness.reasons[0]?.summary}</p>
                )}
              </div>
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
