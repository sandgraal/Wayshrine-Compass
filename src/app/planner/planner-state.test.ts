import { describe, it, expect } from "vitest";
import { portraitsForClass, portraitsMatching } from "@/lib/portraits";
import { sets } from "@/data/sets";
import { skills } from "@/data/skills";
import { cpStars } from "@/data/cpStars";
import {
  decodeState,
  defaultState,
  encodeState,
  makeEntityTables,
  remapPortrait,
  sanitizeState,
  stateFromBuild,
  updateGearSlot,
} from "./planner-state";

/** Tables built from the seed catalog — the shapes the server passes down. */
const seedTables = makeEntityTables({ sets, skills, cpStars });

describe("planner state round-trip", () => {
  it("round-trips a default state through the permalink encoding", () => {
    const s = defaultState();
    expect(decodeState(encodeState(s), seedTables)).toEqual(s);
  });

  it("preserves a valid class-matched portraitId", () => {
    const portrait = portraitsForClass("sorcerer")[0];
    const s = { ...defaultState(), portraitId: portrait.id };
    expect(decodeState(encodeState(s), seedTables)?.portraitId).toBe(portrait.id);
  });

  it("drops an unknown portraitId", () => {
    const s = { ...defaultState(), portraitId: "argonian-bard-male" };
    expect(decodeState(encodeState(s), seedTables)?.portraitId).toBeUndefined();
  });

  it("drops a portrait whose class does not match the draft", () => {
    const templar = portraitsForClass("templar")[0];
    const s = { ...defaultState(), portraitId: templar.id }; // default class is sorcerer
    expect(decodeState(encodeState(s), seedTables)?.portraitId).toBeUndefined();
  });

  it("parses legacy payloads that predate portraitId", () => {
    const legacy = { ...defaultState() } as Record<string, unknown>;
    delete legacy.portraitId;
    const decoded = sanitizeState(legacy, seedTables);
    expect(decoded).not.toBeNull();
    expect(decoded?.portraitId).toBeUndefined();
  });

  it("rejects non-object and unknown-class payloads", () => {
    expect(sanitizeState(null, seedTables)).toBeNull();
    expect(sanitizeState({ className: "bard" }, seedTables)).toBeNull();
  });

  it("dedupes CP star ids so a crafted URL cannot stack one star", () => {
    const s = {
      ...defaultState(),
      cp: {
        warfare: ["cp-deadly-aim", "cp-deadly-aim", "cp-deadly-aim", "cp-master-at-arms"],
        fitness: [],
        craft: [],
      },
    };
    expect(sanitizeState(s, seedTables)?.cp.warfare).toEqual(["cp-deadly-aim", "cp-master-at-arms"]);
  });
});

describe("live-catalog validation", () => {
  // A catalog-only entity, absent from the seed slice: the case the planner
  // previously could not represent (its dropdowns hardcoded seed imports).
  const liveOnlySet = {
    id: "set-tarnished-nightmare",
    name: "Tarnished Nightmare",
    type: "dungeon" as const,
    source: "Scrivener's Hall",
    dlcRequired: null,
    bonuses: [{ pieces: 2, effect: "Adds 657 Critical Chance" }],
    mythicSlot: undefined,
    firstSeenPatch: "U50",
    lastChangedPatch: "U50",
  };
  const liveTables = makeEntityTables({ sets: [...sets, liveOnlySet], skills, cpStars });

  it("accepts gear ids that exist only in the live catalog", () => {
    const s = {
      ...defaultState(),
      gear: [{ slot: "head", setId: "set-tarnished-nightmare", trait: "Divines" }],
    };
    expect(sanitizeState(s, liveTables)?.gear).toEqual([
      { slot: "head", setId: "set-tarnished-nightmare", trait: "Divines", enchant: "" },
    ]);
  });

  it("drops ids the active catalog does not contain", () => {
    const s = {
      ...defaultState(),
      gear: [{ slot: "head", setId: "set-tarnished-nightmare", trait: "Divines" }],
    };
    // Same payload validated against seed-only tables: the live-only id drops.
    expect(sanitizeState(s, seedTables)?.gear).toEqual([]);
  });

  it("round-trips a legacy seed permalink against the live catalog", () => {
    // Permalinks minted while the planner used seed data must keep resolving:
    // seed ids derive from entity names exactly like catalog ids.
    const legacy = stateFromBuild("sorcerer-dps")!;
    const decoded = decodeState(encodeState(legacy), liveTables);
    expect(decoded).not.toBeNull();
    expect(decoded?.gear).toEqual(legacy.gear);
    expect(decoded?.bar).toEqual(legacy.bar);
  });
});

describe("remapPortrait", () => {
  it("keeps race and gender across a class change", () => {
    const nordF = portraitsMatching({ race: "nord", gender: "female", className: "dragonknight" })[0];
    const remapped = remapPortrait(nordF.id, "templar");
    const target = remapped ? portraitsMatching({ className: "templar" }).find((p) => p.id === remapped) : undefined;
    expect(target?.race).toBe("nord");
    expect(target?.gender).toBe("female");
  });

  it("is identity when the class already matches", () => {
    const p = portraitsForClass("warden")[0];
    expect(remapPortrait(p.id, "warden")).toBe(p.id);
  });

  it("returns undefined without a current portrait", () => {
    expect(remapPortrait(undefined, "warden")).toBeUndefined();
  });
});

describe("stateFromBuild", () => {
  it("seeds the fork with the build page's derived portrait", () => {
    const s = stateFromBuild("sorcerer-dps");
    expect(s).not.toBeNull();
    expect(s?.portraitId).toBeDefined();
    // Must survive its own permalink round-trip (class always matches).
    expect(decodeState(encodeState(s!), seedTables)?.portraitId).toBe(s?.portraitId);
  });
});

describe("gear slot editing", () => {
  const forked = [
    { slot: "head" as const, setId: "set-slimecraw", trait: "Divines", weight: "light" as const, enchant: "Maximum Magicka" },
  ];

  it("preserves weight and enchant across a trait change", () => {
    const next = updateGearSlot(forked, "head", "set-slimecraw", "Infused");
    expect(next).toEqual([
      { slot: "head", setId: "set-slimecraw", trait: "Infused", weight: "light", enchant: "Maximum Magicka" },
    ]);
  });

  it("preserves weight and enchant across a set change, and clears on empty", () => {
    const swapped = updateGearSlot(forked, "head", "set-oakensoul-ring");
    expect(swapped[0].weight).toBe("light");
    expect(swapped[0].enchant).toBe("Maximum Magicka");
    expect(updateGearSlot(forked, "head", "")).toEqual([]);
  });

  it("edited gear still round-trips the permalink", () => {
    const s = { ...defaultState(), gear: updateGearSlot(forked, "head", "set-slimecraw", "Infused") };
    expect(decodeState(encodeState(s), seedTables)?.gear).toEqual(s.gear);
  });
});

describe("permalink codec safety", () => {
  it("round-trips non-Latin-1 enchant text", () => {
    const s = {
      ...defaultState(),
      gear: [{ slot: "head" as const, setId: "set-slimecraw", trait: "Divines", enchant: "Präzise ⚔ 魔力" }],
    };
    // The old btoa(JSON.stringify(...)) encoder threw here.
    const decoded = decodeState(encodeState(s), seedTables);
    expect(decoded?.gear[0].enchant).toBe("Präzise ⚔ 魔力");
  });
});

describe("passive skills", () => {
  const passiveTables = makeEntityTables({
    sets,
    skills: [
      ...skills,
      {
        id: "skill-dragonknight-ardent-flame-combustion",
        name: "Combustion",
        className: "dragonknight",
        line: "ardent-flame",
        lineLabel: "Ardent Flame",
        ultimate: false,
        passive: true,
        description: "",
        morphs: [],
        firstSeenPatch: "U50",
        lastChangedPatch: "U50",
      },
    ],
    cpStars,
  });

  it("rejects passives from bar slots in the sanitizer", () => {
    const s = {
      ...defaultState(),
      className: "dragonknight" as const,
      lines: ["dragonknight/ardent-flame"],
      bar: {
        front: ["skill-dragonknight-ardent-flame-combustion"],
        frontUlt: "",
        back: [],
        backUlt: "",
      },
      cp: { warfare: [], fitness: [], craft: [] },
    };
    expect(sanitizeState(s, passiveTables)?.bar.front).toEqual([]);
  });
});
