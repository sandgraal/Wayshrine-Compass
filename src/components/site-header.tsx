"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PlatformToggle } from "@/components/platform-toggle";
import { CompassMark } from "@/components/illustrations";

const NAV = [
  { href: "/builds", label: "Builds" },
  { href: "/what-next", label: "What Next" },
  { href: "/planner", label: "Planner" },
  { href: "/sets", label: "Sets" },
  { href: "/skills", label: "Skills" },
  { href: "/zones", label: "Zones" },
  { href: "/patch-tracker", label: "Patch Tracker" },
];

export function SiteHeader({ currentPatch }: { currentPatch: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          aria-label="Wayshrine Compass — home"
          className="flex items-center gap-2.5 font-semibold text-primary"
        >
          <CompassMark className="size-7" />
          <span className="hidden sm:inline">Wayshrine Compass</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
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
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-nav-mobile"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="site-nav-mobile" className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
