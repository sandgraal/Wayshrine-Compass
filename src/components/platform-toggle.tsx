"use client";

import { Gamepad2, Monitor } from "lucide-react";
import type { Platform } from "@/lib/types";
import { usePlatform } from "@/components/platform-provider";
import { cn } from "@/lib/utils";

/** Global console-mode toggle (Phase 4), persisted per profile. */
export function PlatformToggle() {
  const { platform, setPlatform } = usePlatform();

  const button = (id: Platform, label: string, Icon: typeof Monitor) => (
    <button
      onClick={() => setPlatform(id)}
      aria-pressed={platform === id}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors",
        platform === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-secondary p-0.5 text-xs"
      role="group"
      aria-label="Platform mode"
    >
      {button("pc", "PC", Monitor)}
      {button("console", "Console", Gamepad2)}
    </div>
  );
}
