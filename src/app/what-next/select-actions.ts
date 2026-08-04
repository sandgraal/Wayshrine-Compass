import type { NextAction, PlayerProfile } from "@/lib/types";
import { whatNext } from "@/lib/engine/whatNext";

/**
 * Progress-aware selection over the deterministic engine. The engine stays
 * pure — done/dismissed filtering is a caller concern, applied here so the
 * list backfills: hiding two suggestions surfaces the next two candidates
 * instead of shrinking the list to three.
 */

/**
 * The `unlock-companion-<id>` rule rotates through companions, so dismissing
 * one would just surface the next. A dismissal of any member collapses to the
 * family key: "stop suggesting companions." (Done stays per-id — unlocking
 * Bastian is a fact about Bastian, and suggesting Mirri next is correct.)
 * Mirrors the art-map collapse in action-art.ts.
 */
export const COMPANION_FAMILY = "unlock-companion";

export function dismissKey(actionId: string): string {
  return actionId.startsWith(`${COMPANION_FAMILY}-`) ? COMPANION_FAMILY : actionId;
}

export interface WhatNextProgress {
  /** Action ids the player marked completed. Full ids, including companions. */
  done: string[];
  /** Dismiss keys (see dismissKey) the player asked to stop seeing. */
  dismissed: string[];
}

export const EMPTY_PROGRESS: WhatNextProgress = { done: [], dismissed: [] };

export interface SelectedActions {
  /** The ranked to-do list, backfilled to `count` while candidates remain. */
  visible: NextAction[];
  /** Actions the player marked done that the engine still emits for this profile. */
  completed: NextAction[];
  /** Actions hidden by dismissal, shown under "Hidden" for undo. */
  hidden: NextAction[];
}

/**
 * Larger than the rule count, so the engine returns every candidate it can
 * emit for the profile and filtering can always backfill to `count`.
 */
const CANDIDATE_POOL = 25;

export function selectActions(
  profile: PlayerProfile,
  progress: WhatNextProgress,
  count = 5
): SelectedActions {
  const done = new Set(progress.done);
  const dismissed = new Set(progress.dismissed);
  const all = whatNext(profile, CANDIDATE_POOL);
  return {
    visible: all.filter((a) => !done.has(a.id) && !dismissed.has(dismissKey(a.id))).slice(0, count),
    completed: all.filter((a) => done.has(a.id)),
    hidden: all.filter((a) => !done.has(a.id) && dismissed.has(dismissKey(a.id))),
  };
}
