import { describe, it, expect } from "vitest";
import { portraitsForClass, portraitsMatching } from "@/lib/portraits";
import {
  decodeState,
  defaultState,
  encodeState,
  remapPortrait,
  sanitizeState,
  stateFromBuild,
} from "./planner-state";

describe("planner state round-trip", () => {
  it("round-trips a default state through the permalink encoding", () => {
    const s = defaultState();
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("preserves a valid class-matched portraitId", () => {
    const portrait = portraitsForClass("sorcerer")[0];
    const s = { ...defaultState(), portraitId: portrait.id };
    expect(decodeState(encodeState(s))?.portraitId).toBe(portrait.id);
  });

  it("drops an unknown portraitId", () => {
    const s = { ...defaultState(), portraitId: "argonian-bard-male" };
    expect(decodeState(encodeState(s))?.portraitId).toBeUndefined();
  });

  it("drops a portrait whose class does not match the draft", () => {
    const templar = portraitsForClass("templar")[0];
    const s = { ...defaultState(), portraitId: templar.id }; // default class is sorcerer
    expect(decodeState(encodeState(s))?.portraitId).toBeUndefined();
  });

  it("parses legacy payloads that predate portraitId", () => {
    const legacy = { ...defaultState() } as Record<string, unknown>;
    delete legacy.portraitId;
    const decoded = sanitizeState(legacy);
    expect(decoded).not.toBeNull();
    expect(decoded?.portraitId).toBeUndefined();
  });

  it("rejects non-object and unknown-class payloads", () => {
    expect(sanitizeState(null)).toBeNull();
    expect(sanitizeState({ className: "bard" })).toBeNull();
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
    expect(decodeState(encodeState(s!))?.portraitId).toBe(s?.portraitId);
  });
});
