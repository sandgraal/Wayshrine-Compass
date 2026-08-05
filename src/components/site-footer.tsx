import Link from "next/link";
import Image from "next/image";
import { CompassMark } from "@/components/illustrations";
import { NAV } from "@/lib/nav";

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
            <Image
              src="/brand/emblem.webp"
              alt=""
              aria-hidden
              width={96}
              height={96}
              className="mt-2 rounded-xl border border-border/60 opacity-80"
            />
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Explore</span>
              <Link href="/" className="text-muted-foreground no-underline hover:text-foreground">
                Home
              </Link>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground no-underline hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/about" className="text-muted-foreground no-underline hover:text-foreground">
                About
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
          and derived from our patch-versioned database, currently {currentPatch} (source:{" "}
          {source} ·{" "}
          <Link href="/admin" className="underline underline-offset-2 hover:text-foreground">
            admin
          </Link>
          ).
        </p>
      </div>
    </footer>
  );
}
