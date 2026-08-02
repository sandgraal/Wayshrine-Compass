"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Platform } from "@/lib/types";
import { PLATFORM_COOKIE } from "@/lib/platform";

/**
 * Client-side platform mode (Phase 4). Persisted in localStorage so the site
 * works on fully static hosting (GitHub Pages) as well as Vercel.
 */
const PlatformContext = createContext<{
  platform: Platform;
  setPlatform: (p: Platform) => void;
}>({ platform: "pc", setPlatform: () => {} });

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatformState] = useState<Platform>("pc");

  useEffect(() => {
    if (localStorage.getItem(PLATFORM_COOKIE) === "console") setPlatformState("console");
  }, []);

  const setPlatform = (p: Platform) => {
    localStorage.setItem(PLATFORM_COOKIE, p);
    setPlatformState(p);
  };

  return <PlatformContext.Provider value={{ platform, setPlatform }}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  return useContext(PlatformContext);
}
