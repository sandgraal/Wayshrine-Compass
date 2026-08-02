import { describe, expect, it } from "vitest";
import type { PlayerGoal, PlayerPlatform, PlayerProfile } from "@/lib/types";
import { companions } from "@/data/companions";
import { whatNext } from "./whatNext";

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

const companionById = new Map(companions.map((c) => [c.id, c]));

describe("whatNext engine (Phase 3 acceptance)", () => {
  it("returns 5 ranked actions for the spec's example profile (Xbox / Sorc / L6 / ESO Plus / leveling)", () => {
    const actions = whatNext(baseProfile);
    expect(actions).toHaveLength(5);
    // Ranked descending by score
    for (let i = 1; i < actions.length; i++) {
      expect(actions[i - 1].score).toBeGreaterThanOrEqual(actions[i].score);
    }
    // Every item states why / payoff / time cost
    for (const a of actions) {
      expect(a.why.length).toBeGreaterThan(10);
      expect(a.payoff.length).toBeGreaterThan(5);
      expect(a.timeCost.length).toBeGreaterThan(2);
    }
    // Companion unlock should be present (ESO Plus grants the DLC)
    expect(actions.some((a) => a.id.startsWith("unlock-companion-"))).toBe(true);
  });

  it("never recommends a companion from DLC the player lacks", () => {
    const noDlc: PlayerProfile = { ...baseProfile, esoPlus: false, dlcOwned: [] };
    const actions = whatNext(noDlc);
    expect(actions.some((a) => a.id.startsWith("unlock-companion-"))).toBe(false);

    const blackwoodOnly: PlayerProfile = { ...noDlc, dlcOwned: ["blackwood"] };
    const withBlackwood = whatNext(blackwoodOnly, 10);
    const companionAction = withBlackwood.find((a) => a.id.startsWith("unlock-companion-"));
    expect(companionAction).toBeDefined();
    const companionId = companionAction!.id.replace("unlock-companion-", "");
    expect(companionById.get(companionId)?.dlcRequired).toBe("blackwood");
  });

  it("never recommends content above the player's level gate", () => {
    const level5: PlayerProfile = { ...baseProfile, level: 5, goal: "trials" };
    const actions = whatNext(level5, 10);
    const ids = actions.map((a) => a.id);
    expect(ids).not.toContain("daily-random-normal"); // level 10 gate
    expect(ids).not.toContain("first-normal-trial"); // level 50 gate
    expect(ids).not.toContain("unlock-subclassing"); // level 50 gate
    expect(ids).not.toContain("pvp-intro"); // level 10 gate
  });

  it("never surfaces addon-dependent advice on console, and offers it on PC", () => {
    const goldConsole: PlayerProfile = { ...baseProfile, platform: "playstation", level: 50, goal: "gold" };
    const consoleActions = whatNext(goldConsole, 10);
    expect(consoleActions.every((a) => !a.addonDependent)).toBe(true);

    const goldPc: PlayerProfile = { ...goldConsole, platform: "pc" };
    const pcActions = whatNext(goldPc, 10);
    expect(pcActions.some((a) => a.addonDependent)).toBe(true);
  });

  it("is deterministic and valid for the full profile matrix", () => {
    const platforms: PlayerPlatform[] = ["pc", "xbox", "playstation"];
    const goals: PlayerGoal[] = ["leveling", "gold", "solo-overland", "dungeons", "trials", "pvp"];
    const levels = [1, 6, 10, 30, 49, 50];
    const cps = [0, 160, 810, 3600];

    for (const platform of platforms) {
      for (const goal of goals) {
        for (const level of levels) {
          for (const cp of cps) {
            for (const esoPlus of [true, false]) {
              const p: PlayerProfile = { ...baseProfile, platform, goal, level, cp: level === 50 ? cp : 0, esoPlus };
              const a1 = whatNext(p);
              const a2 = whatNext(p);
              expect(a1).toEqual(a2); // deterministic
              expect(a1).toHaveLength(5); // spec: 5 actions for any valid profile
              if (platform !== "pc") {
                expect(a1.every((a) => !a.addonDependent)).toBe(true);
              }
            }
          }
        }
      }
    }
  });
});
