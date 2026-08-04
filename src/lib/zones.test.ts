import { describe, expect, it } from "vitest";
import { zones } from "@/data/zones";
import { sets } from "@/data/sets";
import {
  DLC_META,
  groupZonesByTier,
  setsForZone,
  zoneAccess,
  ZONE_TIER_ORDER,
} from "./zones";

const zoneById = (id: string) => {
  const z = zones.find((zone) => zone.id === id);
  if (!z) throw new Error(`test fixture missing zone ${id}`);
  return z;
};

describe("zoneAccess", () => {
  it("classes ungated zones as base game with no pack name", () => {
    const access = zoneAccess(zoneById("zone-auridon"));
    expect(access.tier).toBe("Base game");
    expect(access.packName).toBeNull();
  });

  it("names the chapter and states Chapters are outside ESO Plus", () => {
    const access = zoneAccess(zoneById("zone-blackwood"));
    expect(access.tier).toBe("Chapter");
    expect(access.packName).toBe("Blackwood");
    expect(access.note).toMatch(/ESO Plus/);
  });

  it("classes Firesong (Galen) as a DLC game pack", () => {
    const access = zoneAccess(zoneById("zone-galen"));
    expect(access.tier).toBe("DLC");
    expect(access.packName).toBe("Firesong");
  });

  it("classes the Worm Cult content (Solstice) as a season", () => {
    const access = zoneAccess(zoneById("zone-solstice"));
    expect(access.tier).toBe("Season");
    expect(access.packName).toBe("Seasons of the Worm Cult");
  });

  it("covers every gate id the seed zones carry (no title-case fallback in prod)", () => {
    for (const zone of zones) {
      if (zone.dlcRequired) {
        expect(DLC_META, `missing DLC_META for ${zone.dlcRequired}`).toHaveProperty(
          zone.dlcRequired
        );
      }
    }
  });
});

describe("setsForZone", () => {
  it("matches chapter/DLC zones on the exact gate", () => {
    const highIsle = setsForZone(zoneById("zone-high-isle"), sets);
    expect(highIsle.length).toBe(4);
    expect(highIsle.every((s) => s.dlcRequired === "high-isle")).toBe(true);

    expect(setsForZone(zoneById("zone-telvanni-peninsula"), sets).length).toBe(3);
    expect(setsForZone(zoneById("zone-blackwood"), sets).length).toBe(2);
    expect(setsForZone(zoneById("zone-west-weald"), sets).length).toBe(2);
  });

  it("never leaks a set gated to a different chapter", () => {
    for (const zone of zones) {
      if (!zone.dlcRequired) continue;
      for (const s of setsForZone(zone, sets)) {
        expect(s.dlcRequired).toBe(zone.dlcRequired);
      }
    }
  });

  it("matches base-game zones by source text, ignoring the parenthetical", () => {
    const cyrodiil = setsForZone(zoneById("zone-cyrodiil"), sets);
    expect(cyrodiil.map((s) => s.id)).toContain("set-deadly-strike");
    expect(cyrodiil.every((s) => s.dlcRequired === null)).toBe(true);
  });

  it("returns nothing rather than guessing when a zone has no curated sets", () => {
    // Base game with no source mention, and a chapter the seed doesn't cover.
    expect(setsForZone(zoneById("zone-auridon"), sets)).toEqual([]);
    expect(setsForZone(zoneById("zone-summerset"), sets)).toEqual([]);
  });
});

describe("groupZonesByTier", () => {
  const groups = groupZonesByTier(zones);

  it("orders tiers Base game → Chapter → DLC → Season", () => {
    const order = groups.map((g) => g.tier);
    expect(order).toEqual(ZONE_TIER_ORDER.filter((t) => order.includes(t)));
    expect(order[0]).toBe("Base game");
  });

  it("sorts chapters chronologically by release", () => {
    const chapters = groups.find((g) => g.tier === "Chapter")!.zones.map((z) => z.id);
    expect(chapters.indexOf("zone-vvardenfell")).toBeLessThan(chapters.indexOf("zone-high-isle"));
    expect(chapters.indexOf("zone-high-isle")).toBeLessThan(chapters.indexOf("zone-west-weald"));
  });

  it("accounts for every zone exactly once", () => {
    const grouped = groups.flatMap((g) => g.zones);
    expect(grouped).toHaveLength(zones.length);
    expect(new Set(grouped.map((z) => z.id)).size).toBe(zones.length);
  });
});
