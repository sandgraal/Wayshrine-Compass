"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Gamepad2, Monitor } from "lucide-react";
import type { Platform } from "@/lib/types";
import { PLATFORM_COOKIE } from "@/lib/platform";
import { cn } from "@/lib/utils";

/**
 * Global console-mode toggle (Phase 4). Persisted in a cookie so server
 * components can filter addon-dependent guidance before render.
 */
export function PlatformToggle({ platform }: { platform: Platform }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setPlatform(next: Platform) {
    document.cookie = `${PLATFORM_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary p-0.5 text-xs",
        pending && "opacity-60"
      )}
      role="group"
      aria-label="Platform mode"
    >
      <button
        onClick={() => setPlatform("pc")}
        aria-pressed={platform === "pc"}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors",
          platform === "pc" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Monitor className="size-3.5" /> PC
      </button>
      <button
        onClick={() => setPlatform("console")}
        aria-pressed={platform === "console"}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors",
          platform === "console" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Gamepad2 className="size-3.5" /> Console
      </button>
    </div>
  );
}
