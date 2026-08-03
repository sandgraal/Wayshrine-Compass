import type { Zone } from "@/lib/types";

export const zones: Zone[] = [
  { id: "zone-auridon", name: "Auridon", dlcRequired: null, levelScaled: true },
  { id: "zone-glenumbra", name: "Glenumbra", dlcRequired: null, levelScaled: true },
  { id: "zone-stonefalls", name: "Stonefalls", dlcRequired: null, levelScaled: true },
  { id: "zone-cyrodiil", name: "Cyrodiil (PvP)", dlcRequired: null, levelScaled: true },
  { id: "zone-vvardenfell", name: "Vvardenfell", dlcRequired: "morrowind", levelScaled: true },
  { id: "zone-summerset", name: "Summerset", dlcRequired: "summerset", levelScaled: true },
  { id: "zone-northern-elsweyr", name: "Northern Elsweyr", dlcRequired: "elsweyr", levelScaled: true },
  { id: "zone-blackwood", name: "Blackwood", dlcRequired: "blackwood", levelScaled: true },
  { id: "zone-high-isle", name: "High Isle", dlcRequired: "high-isle", levelScaled: true },
  { id: "zone-galen", name: "Galen", dlcRequired: "firesong", levelScaled: true },
  { id: "zone-telvanni-peninsula", name: "Telvanni Peninsula", dlcRequired: "necrom", levelScaled: true },
  { id: "zone-west-weald", name: "West Weald", dlcRequired: "gold-road", levelScaled: true },
  { id: "zone-solstice", name: "Solstice", dlcRequired: "seasons-of-the-worm-cult", levelScaled: true },
];

/**
 * DLC ids a profile can own, in release order. ESO Plus grants all of these.
 * Covers every content DLC/chapter that gates sets, dungeons, or zones —
 * scripts/build-dataset.mjs maps set sources to exactly these ids (tested).
 */
export const ALL_DLC_IDS = [
  "imperial-city",
  "orsinium",
  "thieves-guild",
  "dark-brotherhood",
  "shadows-of-the-hist",
  "morrowind",
  "horns-of-the-reach",
  "clockwork-city",
  "dragon-bones",
  "summerset",
  "wolfhunter",
  "murkmire",
  "wrathstone",
  "elsweyr",
  "scalebreaker",
  "dragonhold",
  "harrowstorm",
  "greymoor",
  "stonethorn",
  "markarth",
  "flames-of-ambition",
  "blackwood",
  "waking-flame",
  "deadlands",
  "ascending-tide",
  "high-isle",
  "lost-depths",
  "firesong",
  "scribes-of-fate",
  "necrom",
  "scions-of-ithelia",
  "gold-road",
  "seasons-of-the-worm-cult",
];
