import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { PlayerProfile } from "@/lib/types";
import { whatNext } from "@/lib/engine/whatNext";
import { COMPANION_FAMILY, EMPTY_PROGRESS, dismissKey, selectActions } from "./select-actions";
import { ID_ALIASES, parseProgress, parseStoredProfile } from "./progress-store";

const baseProfile: PlayerProfile = {
  platform: "xbox",
  className: "sorcerer",
  level: 6,
  cp: 0,
  esoPlus: true,
  dlcOwned: [],
  companionsOwned: [],
  goal: "leveling",
  hoursPerWeek: 5,
};

describe("selectActions", () => {
  it("matches the raw engine output with empty progress", () => {
    const { visible, completed, hidden } = selectActions(baseProfile, EMPTY_PROGRESS);
    expect(visible).toEqual(whatNext(baseProfile));
    expect(completed).toEqual([]);
    expect(hidden).toEqual([]);
  });

  it("backfills to five when suggestions are done or hidden", () => {
    const first = selectActions(baseProfile, EMPTY_PROGRESS).visible;
    const progress = { done: [first[0].id], dismissed: [dismissKey(first[1].id)] };
    const { visible, completed, hidden } = selectActions(baseProfile, progress);
    expect(visible).toHaveLength(5);
    expect(visible.map((a) => a.id)).not.toContain(first[0].id);
    expect(visible.map((a) => a.id)).not.toContain(first[1].id);
    expect(completed.map((a) => a.id)).toContain(first[0].id);
    expect(hidden.map((a) => a.id)).toContain(first[1].id);
  });

  it("collapses a companion dismissal to the whole family", () => {
    const withCompanion = selectActions(baseProfile, EMPTY_PROGRESS);
    const companion = withCompanion.visible.find((a) => a.id.startsWith(`${COMPANION_FAMILY}-`));
    expect(companion).toBeDefined();
    const progress = { done: [], dismissed: [dismissKey(companion!.id)] };
    // Even with the suggested companion owned (so the rule rotates to the
    // next one), no companion action of any id may resurface.
    const rotated: PlayerProfile = {
      ...baseProfile,
      companionsOwned: [companion!.id.replace(`${COMPANION_FAMILY}-`, "")],
    };
    for (const profile of [baseProfile, rotated]) {
      const { visible } = selectActions(profile, progress);
      expect(visible.some((a) => a.id.startsWith(`${COMPANION_FAMILY}-`))).toBe(false);
    }
  });

  it("keeps done per-companion: completing one lets the next rotate in", () => {
    const first = selectActions(baseProfile, EMPTY_PROGRESS);
    const companion = first.visible.find((a) => a.id.startsWith(`${COMPANION_FAMILY}-`));
    expect(companion).toBeDefined();
    const companionId = companion!.id.replace(`${COMPANION_FAMILY}-`, "");
    // Done on the action id + owning that companion: the engine legitimately
    // suggests the next companion under a different id.
    const next = selectActions(
      { ...baseProfile, companionsOwned: [companionId] },
      { done: [companion!.id], dismissed: [] }
    );
    const rotated = next.visible.find((a) => a.id.startsWith(`${COMPANION_FAMILY}-`));
    expect(rotated).toBeDefined();
    expect(rotated!.id).not.toBe(companion!.id);
  });

  it("undo restores visibility (pure recompute)", () => {
    const first = selectActions(baseProfile, EMPTY_PROGRESS).visible;
    const done = selectActions(baseProfile, { done: [first[0].id], dismissed: [] });
    expect(done.visible.map((a) => a.id)).not.toContain(first[0].id);
    const undone = selectActions(baseProfile, EMPTY_PROGRESS);
    expect(undone.visible.map((a) => a.id)).toContain(first[0].id);
  });

  it("never surfaces addon-dependent actions on console, in any bucket", () => {
    // goal: gold is the profile where price-tracking (addonDependent) fires.
    const goldXbox: PlayerProfile = { ...baseProfile, goal: "gold", platform: "xbox" };
    const everythingElseDismissed = {
      done: [],
      dismissed: selectActions(goldXbox, EMPTY_PROGRESS).visible.map((a) => dismissKey(a.id)),
    };
    for (const progress of [EMPTY_PROGRESS, everythingElseDismissed]) {
      const { visible, completed, hidden } = selectActions(goldXbox, progress);
      for (const a of [...visible, ...completed, ...hidden]) {
        expect(a.addonDependent ?? false).toBe(false);
      }
    }
  });
});

describe("id stability contract", () => {
  // The engine source is the authority on ids (action-art.test.ts precedent).
  const engineSource = readFileSync("src/lib/engine/whatNext.ts", "utf8");
  const engineIds = [...engineSource.matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1]);

  it("no static rule id collides with the companion family prefix", () => {
    expect(engineIds.length).toBeGreaterThan(0);
    for (const id of engineIds) {
      expect(dismissKey(id)).toBe(id);
    }
  });

  it("ID_ALIASES targets only current engine ids", () => {
    const known = new Set(engineIds);
    for (const target of Object.values(ID_ALIASES)) {
      expect(known.has(target) || target.startsWith(`${COMPANION_FAMILY}-`)).toBe(true);
    }
  });
});

describe("stored-value parsing", () => {
  it("parses a well-formed progress payload, deduped and family-collapsed", () => {
    const raw = JSON.stringify({
      v: 1,
      done: ["set-mundus", "set-mundus", "unlock-companion-companion-bastian"],
      dismissed: ["unlock-companion-companion-mirri", "join-guilds"],
    });
    expect(parseProgress(raw)).toEqual({
      done: ["set-mundus", "unlock-companion-companion-bastian"],
      dismissed: ["unlock-companion", "join-guilds"],
    });
  });

  it("falls back to empty on garbage, wrong version, or non-string entries", () => {
    expect(parseProgress(null)).toEqual({ done: [], dismissed: [] });
    expect(parseProgress("not json")).toEqual({ done: [], dismissed: [] });
    expect(parseProgress(JSON.stringify({ v: 2, done: ["x"] }))).toEqual({ done: [], dismissed: [] });
    expect(parseProgress(JSON.stringify({ v: 1, done: [42, null, "ok"] }))).toEqual({
      done: ["ok"],
      dismissed: [],
    });
  });

  it("round-trips a stored profile and clamps out-of-range numbers", () => {
    const profile: PlayerProfile = { ...baseProfile, level: 50, cp: 1200 };
    const raw = JSON.stringify({ v: 1, profile });
    expect(parseStoredProfile(raw)).toEqual(profile);

    const tampered = JSON.stringify({ v: 1, profile: { ...profile, level: 9999, cp: -5 } });
    const parsed = parseStoredProfile(tampered);
    expect(parsed?.level).toBe(50);
    expect(parsed?.cp).toBe(0);
  });

  it("rejects profiles with unknown class, platform, or goal", () => {
    const bad = (patch: Record<string, unknown>) =>
      parseStoredProfile(JSON.stringify({ v: 1, profile: { ...baseProfile, ...patch } }));
    expect(bad({ className: "bard" })).toBeNull();
    expect(bad({ platform: "switch" })).toBeNull();
    expect(bad({ goal: "housing" })).toBeNull();
    expect(parseStoredProfile("junk")).toBeNull();
    expect(parseStoredProfile(null)).toBeNull();
  });

  it("only accepts a real boolean esoPlus, so tampered strings can't grant DLC", () => {
    const withEsoPlus = (v: unknown) =>
      parseStoredProfile(JSON.stringify({ v: 1, profile: { ...baseProfile, esoPlus: v } }))?.esoPlus;
    expect(withEsoPlus(true)).toBe(true);
    expect(withEsoPlus(false)).toBe(false);
    // The string "false" is truthy — Boolean(...) would wrongly grant all DLC.
    expect(withEsoPlus("false")).toBe(false);
    expect(withEsoPlus(1)).toBe(false);
    expect(withEsoPlus(undefined)).toBe(false);
  });
});
