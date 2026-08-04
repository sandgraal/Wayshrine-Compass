"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { Platform } from "@/lib/types";
import { PLATFORM_STORAGE_KEY } from "@/lib/platform";

/**
 * Client-side platform mode (Phase 4), backed by localStorage via
 * useSyncExternalStore so it works on static hosting, hydrates without
 * setState-in-effect, and stays in sync across tabs.
 */

const listeners = new Set<() => void>();

/**
 * In-memory fallback for environments without writable storage (private
 * mode, storage quota). Set before attempting localStorage so a failed write
 * still changes the mode for this session.
 */
let memoryValue: Platform | null = null;

function readPlatform(): Platform {
  try {
    const stored = localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (stored === "console" || stored === "pc") return stored;
  } catch {
    // fall through to the in-memory value
  }
  return memoryValue ?? "pc";
}

function writePlatform(p: Platform) {
  memoryValue = p;
  try {
    localStorage.setItem(PLATFORM_STORAGE_KEY, p);
  } catch {
    // storage unavailable; memoryValue carries the session
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
