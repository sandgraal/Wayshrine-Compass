"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PlayerGoal, PlayerPlatform, PlayerProfile } from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";
import { EMPTY_PROGRESS, dismissKey, type WhatNextProgress } from "./select-actions";

/**
 * Client-side What Next persistence, on the platform-provider pattern:
 * localStorage via useSyncExternalStore, an in-memory fallback for
 * environments without writable storage, and the `storage` event for
 * cross-tab sync. Two keys with different reset semantics:
 *
 * - wc-whatnext-progress: { v: 1, done: string[], dismissed: string[] }
 * - wc-whatnext-profile:  { v: 1, profile: PlayerProfile }
 *
 * Stored values are user-controlled input — both parsers rebuild well-formed
 * values and fall back to empty on anything unexpected.
 */

const PROGRESS_KEY = "wc-whatnext-progress";
const PROFILE_KEY = "wc-whatnext-profile";

/**
 * Forwarding map for renamed rule ids. Progress persists in visitors'
 * browsers, so renaming an id in the engine strands their stored state
 * unless the old id is mapped here (old id → current id). Empty today;
 * see the persistence note in src/lib/engine/whatNext.ts before renaming.
 */
export const ID_ALIASES: Record<string, string> = {};

export function parseProgress(raw: string | null): WhatNextProgress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object" || o.v !== 1) return EMPTY_PROGRESS;
    const ids = (v: unknown): string[] =>
      Array.isArray(v)
        ? [
            ...new Set(
              v
                .filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 80)
                .map((x) => ID_ALIASES[x] ?? x)
            ),
          ]
        : [];
    return { done: ids(o.done), dismissed: ids(o.dismissed).map(dismissKey) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

const PLATFORMS: PlayerPlatform[] = ["pc", "xbox", "playstation"];
const GOALS: PlayerGoal[] = ["leveling", "gold", "solo-overland", "dungeons", "trials", "pvp"];

export function parseStoredProfile(raw: string | null): PlayerProfile | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object" || o.v !== 1) return null;
    const p = o.profile as Record<string, unknown>;
    if (!p || typeof p !== "object") return null;
    const num = (v: unknown, min: number, max: number, fallback: number): number =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
    const strs = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= 80).slice(0, 64) : [];
    if (!ALL_CLASSES.includes(p.className as PlayerProfile["className"])) return null;
    if (!PLATFORMS.includes(p.platform as PlayerPlatform)) return null;
    if (!GOALS.includes(p.goal as PlayerGoal)) return null;
    return {
      platform: p.platform as PlayerPlatform,
      className: p.className as PlayerProfile["className"],
      level: num(p.level, 1, 50, 1),
      cp: num(p.cp, 0, 3600, 0),
      esoPlus: Boolean(p.esoPlus),
      dlcOwned: strs(p.dlcOwned),
      companionsOwned: strs(p.companionsOwned),
      goal: p.goal as PlayerGoal,
      hoursPerWeek: num(p.hoursPerWeek, 1, 30, 5),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Store plumbing (one instance per key)                               */
/* ------------------------------------------------------------------ */

interface Store<T> {
  subscribe(listener: () => void): () => void;
  read(): T;
  write(raw: string): void;
  clear(): void;
}

function makeStore<T>(key: string, parse: (raw: string | null) => T): Store<T> {
  const listeners = new Set<() => void>();
  // In-memory fallback so private-mode/quota failures still work this session.
  let memoryRaw: string | null = null;
  // Snapshot cache: useSyncExternalStore needs referential stability — return
  // the same parsed object until the underlying raw string changes.
  let cachedRaw: string | null = null;
  let cached: T = parse(null);
  let primed = false;

  const currentRaw = (): string | null => {
    try {
      return localStorage.getItem(key) ?? memoryRaw;
    } catch {
      return memoryRaw;
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      window.addEventListener("storage", listener);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
      };
    },
    read() {
      const raw = currentRaw();
      if (!primed || raw !== cachedRaw) {
        primed = true;
        cachedRaw = raw;
        cached = parse(raw);
      }
      return cached;
    },
    write(raw) {
      memoryRaw = raw;
      try {
        localStorage.setItem(key, raw);
      } catch {
        // storage unavailable; memoryRaw carries the session
      }
      listeners.forEach((l) => l());
    },
    clear() {
      memoryRaw = null;
      try {
        localStorage.removeItem(key);
      } catch {
        // nothing to clear
      }
      listeners.forEach((l) => l());
    },
  };
}

const progressStore = makeStore(PROGRESS_KEY, parseProgress);
const profileStore = makeStore(PROFILE_KEY, parseStoredProfile);

export function useWhatNextProgress() {
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.read,
    () => EMPTY_PROGRESS
  );

  const write = (next: WhatNextProgress) =>
    progressStore.write(JSON.stringify({ v: 1, done: next.done, dismissed: next.dismissed }));

  const markDone = useCallback((id: string) => {
    const p = progressStore.read();
    if (!p.done.includes(id)) write({ ...p, done: [...p.done, id] });
  }, []);
  const unmarkDone = useCallback((id: string) => {
    const p = progressStore.read();
    write({ ...p, done: p.done.filter((d) => d !== id) });
  }, []);
  const dismiss = useCallback((actionId: string) => {
    const p = progressStore.read();
    const key = dismissKey(actionId);
    if (!p.dismissed.includes(key)) write({ ...p, dismissed: [...p.dismissed, key] });
  }, []);
  const undismiss = useCallback((actionId: string) => {
    const p = progressStore.read();
    const key = dismissKey(actionId);
    write({ ...p, dismissed: p.dismissed.filter((d) => d !== key) });
  }, []);
  const resetProgress = useCallback(() => progressStore.clear(), []);

  return { progress, markDone, unmarkDone, dismiss, undismiss, resetProgress };
}

export function useWhatNextProfile() {
  const storedProfile = useSyncExternalStore(
    profileStore.subscribe,
    profileStore.read,
    () => null
  );
  const saveProfile = useCallback((profile: PlayerProfile) => {
    profileStore.write(JSON.stringify({ v: 1, profile }));
  }, []);
  return { storedProfile, saveProfile };
}
