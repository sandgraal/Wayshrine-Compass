"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { Platform } from "@/lib/types";
import { PLATFORM_COOKIE } from "@/lib/platform";

/**
 * Client-side platform mode (Phase 4), backed by localStorage via
 * useSyncExternalStore so it works on static hosting, hydrates without
 * setState-in-effect, and stays in sync across tabs.
 */

const listeners = new Set<() => void>();

function readPlatform(): Platform {
  try {
    return localStorage.getItem(PLATFORM_COOKIE) === "console" ? "console" : "pc";
  } catch {
    return "pc";
  }
}

function writePlatform(p: Platform) {
  try {
    localStorage.setItem(PLATFORM_COOKIE, p);
  } catch {
    // storage unavailable (private mode); the in-memory value still updates
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Cross-tab: the storage event fires in other tabs when the value changes.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const PlatformContext = createContext<{
  platform: Platform;
  setPlatform: (p: Platform) => void;
}>({ platform: "pc", setPlatform: () => {} });

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const platform = useSyncExternalStore(subscribe, readPlatform, () => "pc" as Platform);
  const setPlatform = useCallback((p: Platform) => writePlatform(p), []);

  return <PlatformContext.Provider value={{ platform, setPlatform }}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  return useContext(PlatformContext);
}
