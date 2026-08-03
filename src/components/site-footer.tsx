import Link from "next/link";
import { CompassMark } from "@/components/illustrations";

export function SiteFooter({ currentPatch, source }: { currentPatch: string; source: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <span className="flex items-center gap-2 font-semibold text-primary">
              <CompassMark className="size-5" />
              Wayshrine Compass
            </span>
            <p className="text-sm text-muted-foreground">
              A patch-aware companion for tracking builds, gear sets and champion point trees
              across every update.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Explore</span>
              <Link href="/" className="text-muted-foreground no-underline hover:text-foreground">
                Home
              </Link>
              <Link href="/builds" className="text-muted-foreground no-underline hover:text-foreground">
                Build Guide
              </Link>
              <Link
                href="/patch-tracker"
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                Patch Tracker
              </Link>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Freshness</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <i className="size-2 rounded-full" style={{ background: "var(--verified)" }} />
                Verified
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <i className="size-2 rounded-full" style={{ background: "var(--needs-review)" }} />
                Needs review
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <i className="size-2 rounded-full" style={{ background: "var(--stale)" }} />
                Stale
              </span>
            </div>
          </div>
        </div>
        <p className="max-w-3xl text-xs text-muted-foreground">
          Wayshrine Compass is an unofficial, fan-made companion tool built for players of The
          Elder Scrolls Online. It is not affiliated with, endorsed, sponsored, or specifically
          approved by ZeniMax Online Studios, Bethesda Softworks, or their affiliates. All game
          trademarks and copyrights belong to their respective owners. All guidance is original
          and derived from our patch-versioned database — currently {currentPatch} (source:{" "}
          {source}).
        </p>
      </div>
    </footer>
  );
}
