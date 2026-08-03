import Link from "next/link";
import { PlatformToggle } from "@/components/platform-toggle";
import { CompassMark } from "@/components/illustrations";

const NAV = [
  { href: "/builds", label: "Builds" },
  { href: "/what-next", label: "What Next" },
  { href: "/planner", label: "Planner" },
  { href: "/sets", label: "Sets" },
  { href: "/skills", label: "Skills" },
  { href: "/patch-tracker", label: "Patch Tracker" },
];

export function SiteHeader({ currentPatch }: { currentPatch: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-primary">
          <CompassMark className="size-7" />
          <span className="hidden sm:inline">Wayshrine Compass</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground no-underline transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground sm:inline-block">
            {currentPatch}
          </span>
          <PlatformToggle />
        </div>
      </div>
    </header>
  );
}
