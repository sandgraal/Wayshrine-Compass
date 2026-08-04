#!/usr/bin/env node
/**
 * build-dataset.mjs — builds public/dataset/current.json from UESP's esolog
 * JSON exports (https://esolog.uesp.net, CC-BY-SA).
 *
 * Usage:  node scripts/build-dataset.mjs
 *
 * Sources (fetched politely: identified User-Agent, 1s delay between requests):
 *   - exportJson.php?table=setSummary      -> gear sets
 *   - exportJson.php?table=skillTree       -> class skills (per-rank rows; class
 *                                             lines also derive Class Mastery lines)
 *   - exportJson.php?table=cp2Skills       -> champion point stars
 *   - exportJson.php?table=craftedSkills   -> Scribing grimoires
 *   - exportJson.php?table=craftedScripts  -> Scribing scripts (focus/signature/affix)
 *   - https://esoapi.uesp.net/             -> current game data version (v1010NN -> Update NN)
 *
 * The output conforms to the PatchDataset contract validated by
 * src/lib/ingest/parse.ts (parsePatchDataset).
 *
 * Offline fallback: esolog.uesp.net sits behind Cloudflare, which sometimes
 * challenges non-browser clients. If a fetch fails after one retry, the script
 * falls back to raw export files in the directory named by $UESP_CACHE_DIR
 * (files: setSummary.json, skillTree.json, cp2Skills.json, apiVersions.json).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "dataset");
const OUT_FILE = path.join(OUT_DIR, "current.json");

const USER_AGENT = "WayshrineCompass-dataset-builder/0.1 (contact: cennisc@gmail.com)";
const DELAY_MS = 1000;
const CACHE_DIR = process.env.UESP_CACHE_DIR || "";

const NONCLASS_CATEGORIES = ["Weapon", "Guild", "World", "Armor"];

const CLASSES = [
  "Dragonknight",
  "Sorcerer",
  "Nightblade",
  "Templar",
  "Warden",
  "Necromancer",
  "Arcanist",
];

const SET_TYPE_MAP = {
  Crafted: "crafted",
  Overland: "overland",
  Dungeon: "dungeon",
  Trial: "trial",
  Arena: "arena",
  PVP: "pvp",
  Monster: "monster",
  Mythic: "mythic",
};

/**
 * Explicit place-name -> DLC id mapping (ids from src/data/zones.ts
 * ALL_DLC_IDS; the dataset test cross-checks every emitted id against it).
 * setSummary's `sources` field names zones/dungeons/trials/arenas; the DLC a
 * set requires follows from the *place* that drops it. Dungeon sources read
 * "Zone, Dungeon" where the zone is only the location — e.g. "Summerset,
 * Coral Aerie" needs Ascending Tide, not Summerset — so dungeon/trial lookups
 * key on the last segment. `null` marks a known base-game place; places
 * missing from this table stay null too but are counted as unmapped in the
 * build summary so coverage gaps are visible.
 */
const PLACE_DLC = {
  // Base-game zones (overland + starter islands + Cyrodiil + Craglorn).
  "Alik'r Desert": null,
  Auridon: null,
  Bangkorai: null,
  Coldharbour: null,
  Craglorn: null,
  Deshaan: null,
  Eastmarch: null,
  Glenumbra: null,
  Grahtwood: null,
  Greenshade: null,
  "Malabal Tor": null,
  "Reaper's March": null,
  Rivenspire: null,
  Shadowfen: null,
  Stonefalls: null,
  Stormhaven: null,
  "The Rift": null,
  "Khenarthi's Roost, Betnikh, Stros M'Kai, Bal Foyen, Bleakrock Isle": null,
  // DLC/chapter zones.
  Wrothgar: "orsinium",
  "Hew's Bane": "thieves-guild",
  "Gold Coast": "dark-brotherhood",
  Vvardenfell: "morrowind",
  "Clockwork City": "clockwork-city",
  Summerset: "summerset",
  Murkmire: "murkmire",
  "Northern Elsweyr": "elsweyr",
  "Southern Elsweyr": "dragonhold",
  "Western Skyrim": "greymoor",
  "The Reach": "markarth",
  Blackwood: "blackwood",
  Deadlands: "deadlands",
  "High Isle and Amenos": "high-isle",
  Galen: "firesong",
  Necrom: "necrom",
  "West Weald": "gold-road",
  Solstice: "seasons-of-the-worm-cult",
  // Base-game group dungeons.
  "Arx Corinium": null,
  "Banished Cells": null,
  "The Banished Cells": null,
  "Blackheart Haven": null,
  "Blessed Crucible": null,
  "City of Ash": null,
  "Crypt of Hearts": null,
  "Darkshade Caverns": null,
  "Direfrost Keep": null,
  "Elden Hollow": null,
  "Fungal Grotto": null,
  "Selene's Web": null,
  Spindleclutch: null,
  "Tempest Island": null,
  "Vaults of Madness": null,
  Volenfell: null,
  "Wayrest Sewers": null,
  // DLC group dungeons.
  "Imperial City Prison": "imperial-city",
  "White-Gold Tower": "imperial-city",
  "Cradle of Shadows": "shadows-of-the-hist",
  "Ruins of Mazzatun": "shadows-of-the-hist",
  "Bloodroot Forge": "horns-of-the-reach",
  "Falkreath Hold": "horns-of-the-reach",
  "Fang Lair": "dragon-bones",
  "Scalecaller Peak": "dragon-bones",
  "March of Sacrifices": "wolfhunter",
  "Moon Hunter Keep": "wolfhunter",
  "Depths of Malatar": "wrathstone",
  Frostvault: "wrathstone",
  "Lair of Maarselok": "scalebreaker",
  "Moongrave Fane": "scalebreaker",
  Icereach: "harrowstorm",
  "Unhallowed Grave": "harrowstorm",
  "Castle Thorn": "stonethorn",
  "Stone Garden": "stonethorn",
  "Black Drake Villa": "flames-of-ambition",
  "The Cauldron": "flames-of-ambition",
  "Red Petal Bastion": "waking-flame",
  "The Dread Cellar": "waking-flame",
  "Coral Aerie": "ascending-tide",
  "Shipwright's Regret": "ascending-tide",
  "Earthen Root Enclave": "lost-depths",
  "Graven Deep": "lost-depths",
  "Bal Sunnar": "scribes-of-fate",
  "Scrivener's Hall": "scribes-of-fate",
  "Bedlam Veil": "scions-of-ithelia",
  "Oathsworn Pit": "scions-of-ithelia",
  // Trials.
  "Craglorn Trials": null,
  "Aetherian Archive": null,
  "Hel Ra Citadel": null,
  "Sanctum Ophidia": null,
  "Maw of Lorkhaj": "thieves-guild",
  "Halls of Fabrication": "morrowind",
  "Asylum Sanctorium": "clockwork-city",
  Cloudrest: "summerset",
  Sunspire: "elsweyr",
  "Kyne's Aegis": "greymoor",
  Rockgrove: "blackwood",
  "Dreadsail Reef": "high-isle",
  "Sanity's Edge": "necrom",
  "Lucent Citadel": "gold-road",
  "Ossein Cage": "seasons-of-the-worm-cult",
  // Arenas.
  "Dragonstar Arena": null,
  "Maelstrom Arena": "orsinium",
  "Blackrose Prison": "murkmire",
  "Vateshran Hollows": "markarth",
  // Imperial City districts (monster-shoulder sources name the district boss).
  "Arboretum District": "imperial-city",
  "Arena District": "imperial-city",
  "Elven Gardens District": "imperial-city",
  "Memorial District": "imperial-city",
  "Nobles District": "imperial-city",
  "Temple District": "imperial-city",
  // PvP sources (full source strings; Battlegrounds and Cyrodiil are base).
  Battlegrounds: null,
  Cyrodiil: null,
  "Cyrodiil, Bruma": null,
  "Cyrodiil, Cropsford": null,
  "Cyrodiil, Vlastarus": null,
  "Cyrodiil, Elite Gear Vendor": null,
  "Elite Gear Vendors": null,
  "Rewards for the Worthy": null,
  "Rewards of the Worthy": null,
  "Imperial City Treasure Vaults": "imperial-city",
  "Tel Var Merchant": "imperial-city",
};

/**
 * Resolve a set's DLC gate from its type + source string. Conservative:
 * crafted sets stay null (stations sit in DLC zones but the gear itself is
 * tradeable and wearable by anyone), mythics stay null (leads span many
 * DLCs), and any place not in PLACE_DLC stays null and is reported.
 */
export function resolveSetDlc(type, source, unmapped) {
  if (type === "crafted" || type === "mythic") return null;
  let key;
  if (type === "dungeon" || type === "trial") {
    // "Zone, Dungeon" -> the dungeon names the gate; single names stand alone.
    const parts = source.split(",");
    key = parts[parts.length - 1].trim();
  } else if (type === "monster") {
    // "Boss in Dungeon II, Vendor" -> dungeon (roman numerals name the wing,
    // both wings of a base dungeon are base and DLC dungeons have no wings).
    const m = source.match(/\bin ([^,]+)/);
    key = m ? m[1].trim().replace(/\s+I{1,2}$/, "") : source;
  } else {
    key = source; // overland zones, arenas, pvp sources match whole
  }
  if (key in PLACE_DLC) return PLACE_DLC[key];
  unmapped.set(key, (unmapped.get(key) ?? 0) + 1);
  return null;
}

/**
 * Grimoire skill line, keyed by the export's icon token — craftedSkills has
 * no line-name column, but every grimoire's icon names its line (verified
 * against all 12 U50 grimoires). Unknown icons throw so a future grimoire
 * can't silently ship with a missing line.
 */
const GRIMOIRE_LINE_BY_ICON = {
  grimoire_bow: ["bow", "Bow"],
  grimoire_1handed: ["one-hand-and-shield", "One Hand and Shield"],
  grimoire_2handed: ["two-handed", "Two Handed"],
  grimoire_dualwield: ["dual-wield", "Dual Wield"],
  grimoire_staffdestro: ["destruction-staff", "Destruction Staff"],
  grimoire_staffresto: ["restoration-staff", "Restoration Staff"],
  grimoire_soulmagic1: ["soul-magic", "Soul Magic"],
  grimoire_soulmagic2: ["soul-magic", "Soul Magic"],
  grimoire_magesguild: ["mages-guild", "Mages Guild"],
  grimoire_fightersguild: ["fighters-guild", "Fighters Guild"],
  grimoire_assault: ["assault", "Assault"],
  grimoire_support: ["support", "Support"],
};

const SCRIPT_SLOT_BY_INDEX = { 1: "focus", 2: "signature", 3: "affix" };

// Scribing ships with the Gold Road chapter; every grimoire is gated on it.
const SCRIBING_DLC = "gold-road";

// disciplineIndex -> tree, verified empirically against known stars:
//   Steed's Blessing (craft) = 1, Deadly Aim / Master-at-Arms (warfare) = 2,
//   Boundless Vitality (fitness) = 3.
const CP_TREE_BY_DISCIPLINE_INDEX = { 1: "craft", 2: "warfare", 3: "fitness" };

/* ------------------------------------------------------------------ */
/* helpers                                                             */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function kebab(s) {
  return s
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Strip ESO markup: |cffffff...|r color codes and |t...|t texture tags. */
function stripEsoCodes(s) {
  return String(s ?? "")
    .replace(/\|c[0-9a-fA-F]{6}/g, "")
    .replace(/\|r/g, "")
    .replace(/\|t[^|]*\|t/g, "")
    // Dynamic character-state tail ("Current bonus: 0 ...") appears in set and
    // skill text too, not only CP stars — never part of the definition.
    .replace(/\n+Current bonus:.*$/is, "")
    .trim();
}

async function fetchTextOnce(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  if (/challenges\.cloudflare\.com|Just a moment/i.test(text.slice(0, 2000))) {
    throw new Error(`Cloudflare challenge page for ${url}`);
  }
  return text;
}

/** Fetch with one retry, falling back to $UESP_CACHE_DIR/<cacheName>.json. */
async function fetchText(url, cacheName) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await fetchTextOnce(url);
      console.log(`fetched ${url} (${text.length} bytes)`);
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(`attempt ${attempt} failed: ${err.message}`);
      if (attempt === 1) await sleep(DELAY_MS);
    }
  }
  if (CACHE_DIR) {
    const file = path.join(CACHE_DIR, `${cacheName}.json`);
    if (fs.existsSync(file)) {
      console.warn(`falling back to cached export ${file}`);
      return fs.readFileSync(file, "utf8");
    }
  }
  throw new Error(`Unreachable after retry (and no cache): ${url} — ${lastErr?.message}`);
}

/* ------------------------------------------------------------------ */
/* transforms                                                          */

function transformSets(raw) {
  const rows = JSON.parse(raw).setSummary;
  const sets = [];
  let skipped = 0;
  const unmapped = new Map();
  const bonusRe = /^\((\d+)\s+items?\)\s*(.+)$/s;
  for (const row of rows) {
    const type = SET_TYPE_MAP[row.type];
    if (!type) {
      skipped++;
      continue;
    }
    const bonuses = [];
    for (let i = 1; i <= 12; i++) {
      const desc = stripEsoCodes(row[`setBonusDesc${i}`]);
      if (!desc) continue;
      const m = desc.match(bonusRe);
      if (m) bonuses.push({ pieces: Number(m[1]), effect: m[2].trim() });
      else bonuses.push({ pieces: 1, effect: desc });
    }
    const source = row.sources && row.sources.trim() ? row.sources.trim() : row.type;
    sets.push({
      id: `set-${row.indexName}`,
      name: row.setName,
      type,
      source,
      // UESP setSummary has no DLC field; derived from the source place name
      // via PLACE_DLC (see public/dataset/README.md).
      dlcRequired: resolveSetDlc(type, source, unmapped),
      bonuses,
    });
  }
  sets.sort((a, b) => a.id.localeCompare(b.id));
  return { sets, skipped, unmapped };
}

function transformSkills(raw) {
  const rows = JSON.parse(raw).skillTree;
  const skills = [];
  // Group per-rank rows by class line + base ability. skillTree encodes morphs
  // via rank: ranks 1-4 are the base ability, 5-8 morph one, 9-12 morph two
  // (verified against e.g. Crystal Shard -> Crystal Weapon / Crystal Fragments).
  const groups = new Map();
  for (const row of rows) {
    const [category, lineName] = String(row.skillTypeName).split("::");
    if (!lineName) continue;
    // Class trees keep their class; weapon/guild/world/armor lines are the
    // seed's null-class skills (id prefix "weapon" per src/data/skills.ts).
    const isClass = CLASSES.includes(category);
    if (!isClass && !NONCLASS_CATEGORIES.includes(category)) continue;
    const className = isClass ? category : null;
    const key = `${row.skillTypeName}::${row.baseName}`;
    if (!groups.has(key)) groups.set(key, { className, lineName, rows: [] });
    groups.get(key).rows.push(row);
  }
  for (const { className, lineName, rows: group } of groups.values()) {
    group.sort((a, b) => Number(a.rank) - Number(b.rank));
    const baseName = group[0].baseName;
    const baseRows = group.filter((r) => Number(r.rank) <= 4);
    const baseRow = baseRows[baseRows.length - 1] ?? group[0];
    // Morphs: bucket by rank band, take the max-rank row of each morph name.
    const morphs = [];
    for (const [lo, hi] of [
      [5, 8],
      [9, 12],
    ]) {
      const band = group.filter((r) => Number(r.rank) >= lo && Number(r.rank) <= hi);
      const top = band[band.length - 1];
      if (top && top.name !== baseName) {
        morphs.push({ name: top.name, description: stripEsoCodes(top.description) });
      }
    }
    // Seed/DB id convention: skill-<class>-<line>-<slug> (src/data/skills.ts),
    // so datasets diff against existing entities instead of replacing them all.
    // Collisions are resolved in a second pass below so ids never depend on
    // upstream row order.
    const id = `skill-${className ? kebab(className) : "weapon"}-${kebab(lineName)}-${kebab(baseName)}`;
    skills.push({
      id,
      abilityId: baseRow.abilityId,
      name: baseName,
      line: kebab(lineName),
      lineLabel: lineName,
      ultimate: baseRow.type === "Ultimate",
      description: stripEsoCodes(baseRow.description),
      className: className ? className.toLowerCase() : null,
      morphs,
    });
  }
  // Order-independent collision handling: every member of a colliding
  // candidate-id group gets its stable abilityId suffix (no first-wins bias).
  const byCandidate = new Map();
  for (const s of skills) byCandidate.set(s.id, [...(byCandidate.get(s.id) ?? []), s]);
  for (const [candidate, members] of byCandidate) {
    if (members.length < 2) continue;
    for (const s of members) {
      if (!s.abilityId) throw new Error(`Colliding skill id ${candidate} lacks a stable abilityId`);
      s.id = `${candidate}-${kebab(String(s.abilityId))}`;
    }
  }
  for (const s of skills) delete s.abilityId;
  const dupes = new Set();
  for (const s of skills) {
    if (dupes.has(s.id)) throw new Error(`Unresolvable duplicate skill id: ${s.id}`);
    dupes.add(s.id);
  }
  skills.sort((a, b) => a.id.localeCompare(b.id));
  return { skills };
}

function transformCpStars(raw) {
  const rows = JSON.parse(raw).cp2Skills;
  const cpStars = [];
  const usedIds = new Map();
  for (const row of rows) {
    const tree = CP_TREE_BY_DISCIPLINE_INDEX[Number(row.disciplineIndex)];
    if (!tree) continue;
    // Drop the dynamic "Current bonus: ..." tail — it reflects allocated
    // points, not the star's effect.
    const effect = stripEsoCodes(row.maxDescription)
      .replace(/\n+Current bonus:.*$/is, "")
      .trim();
    let id = `cp-${kebab(row.name)}`;
    if (usedIds.has(id)) id = `${id}-${tree}`;
    usedIds.set(id, true);
    cpStars.push({
      id,
      name: row.name,
      tree,
      effect,
      // skillType 0 = passive (always on once bought); 1 and 2 are the stars
      // players slot into the champion bar (verified: Deadly Aim=1,
      // Steed's Blessing=2, non-slottables like Breakfall=0).
      slottable: Number(row.skillType) !== 0,
    });
  }
  cpStars.sort((a, b) => a.id.localeCompare(b.id));
  return { cpStars };
}

/** Scribing: craftedScripts -> scripts, craftedSkills -> grimoires. */
export function transformScribing(grimoireRaw, scriptRaw) {
  const scriptRows = JSON.parse(scriptRaw).craftedScripts;
  const scripts = [];
  const idByNumeric = new Map();
  const usedIds = new Set();
  for (const row of scriptRows) {
    const slot = SCRIPT_SLOT_BY_INDEX[Number(row.slot)];
    if (!slot) throw new Error(`Unknown script slot '${row.slot}' for ${row.name}`);
    let id = `script-${kebab(row.name)}`;
    if (usedIds.has(id)) id = `${id}-${slot}`;
    if (usedIds.has(id)) throw new Error(`Unresolvable duplicate script id: ${id}`);
    usedIds.add(id);
    idByNumeric.set(String(row.id), id);
    scripts.push({
      id,
      name: row.name,
      slot,
      description: stripEsoCodes(row.description),
      acquisition: stripEsoCodes(row.hint),
    });
  }
  scripts.sort((a, b) => a.id.localeCompare(b.id));

  const grimoireRows = JSON.parse(grimoireRaw).craftedSkills;
  const grimoires = [];
  for (const row of grimoireRows) {
    const iconToken = String(row.icon).replace(/^.*\//, "").replace(/\.dds$/, "");
    const line = GRIMOIRE_LINE_BY_ICON[iconToken];
    if (!line) {
      throw new Error(`Unknown grimoire icon '${iconToken}' (${row.name}) — extend GRIMOIRE_LINE_BY_ICON`);
    }
    // slotsN columns are comma-separated craftedScripts row ids: the scripts
    // this grimoire accepts in its focus/signature/affix slot. A dangling id
    // means the two exports are out of sync — fail, don't drop.
    const mapSlot = (csv, label) =>
      String(csv ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => {
          const id = idByNumeric.get(n);
          if (!id) throw new Error(`Grimoire ${row.name} ${label} slot references unknown script id ${n}`);
          return id;
        })
        .sort();
    grimoires.push({
      id: `grimoire-${kebab(row.name)}`,
      name: row.name,
      line: line[0],
      lineLabel: line[1],
      description: stripEsoCodes(row.description),
      acquisition: stripEsoCodes(row.hint),
      dlcRequired: SCRIBING_DLC,
      focusScripts: mapSlot(row.slots1, "focus"),
      signatureScripts: mapSlot(row.slots2, "signature"),
      affixScripts: mapSlot(row.slots3, "affix"),
    });
  }
  grimoires.sort((a, b) => a.id.localeCompare(b.id));
  return { grimoires, scripts };
}

/**
 * Class Mastery lines: one entity per class skill line (including each
 * class's own `class-mastery` meta line, which cannot be grafted). Derived
 * from the transformed skills so the two collections can't disagree.
 */
export function transformClassMastery(skills) {
  const seen = new Map();
  for (const s of skills) {
    if (!s.className) continue;
    const id = `mastery-${s.className}-${s.line}`;
    if (seen.has(id)) continue;
    const display = s.className.charAt(0).toUpperCase() + s.className.slice(1);
    seen.set(id, {
      id,
      name: `${s.lineLabel} (${display})`,
      className: s.className,
      line: s.line,
      lineLabel: s.lineLabel,
      graftable: s.line !== "class-mastery",
    });
  }
  return { classMasteryLines: [...seen.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

function parsePatchFromVersions(text) {
  // Page lists lines like "v101050 -- Created on 2026-06-10 16:26:34".
  const re = /v(10\d{4})\s*(?:--|&#8211;|—)?\s*Created on\s*(\d{4}-\d{2}-\d{2})/g;
  let best = null;
  for (const m of text.matchAll(re)) {
    const v = Number(m[1]);
    if (!best || v > best.v) best = { v, created: m[2] };
  }
  if (!best) {
    // Fall back to bare version tokens without dates.
    for (const m of text.matchAll(/v(10\d{4})/g)) {
      const v = Number(m[1]);
      if (!best || v > best.v) best = { v, created: null };
    }
  }
  if (!best) throw new Error("Could not determine game version from esoapi.uesp.net");
  const update = best.v >= 101000 ? best.v - 101000 : best.v - 100000;
  return {
    id: `patch-u${update}`,
    code: `U${update}`,
    name: `Update ${update}`,
    // Best effort: UESP creates its data dump within days of an update going
    // live, so the dump creation date approximates the release date.
    releasedAt: best.created ?? new Date().toISOString().slice(0, 10),
    season: null,
  };
}

/* ------------------------------------------------------------------ */
/* main                                                                */

async function main() {
  const setRaw = await fetchText(
    "https://esolog.uesp.net/exportJson.php?table=setSummary",
    "setSummary"
  );
  await sleep(DELAY_MS);
  const skillRaw = await fetchText(
    "https://esolog.uesp.net/exportJson.php?table=skillTree",
    "skillTree"
  );
  await sleep(DELAY_MS);
  const cpRaw = await fetchText(
    "https://esolog.uesp.net/exportJson.php?table=cp2Skills",
    "cp2Skills"
  );
  await sleep(DELAY_MS);
  const grimoireRaw = await fetchText(
    "https://esolog.uesp.net/exportJson.php?table=craftedSkills",
    "craftedSkills"
  );
  await sleep(DELAY_MS);
  const scriptRaw = await fetchText(
    "https://esolog.uesp.net/exportJson.php?table=craftedScripts",
    "craftedScripts"
  );
  await sleep(DELAY_MS);
  let patch;
  if (process.env.PATCH_CODE) {
    // Cloudflare sometimes challenges esoapi; allow a manual override.
    const n = process.env.PATCH_CODE.replace(/^U/i, "");
    // The release date orders patches in the DB — a regeneration-date default
    // could corrupt current-patch/freshness ordering, so require it explicitly.
    const date = process.env.PATCH_DATE;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("PATCH_CODE override requires PATCH_DATE=YYYY-MM-DD (the patch's release date)");
    }
    patch = { id: `patch-u${n}`, code: `U${n}`, name: `Update ${n}`, releasedAt: date, season: null };
  } else {
    const versionsRaw = await fetchText("https://esoapi.uesp.net/", "apiVersions");
    patch = parsePatchFromVersions(versionsRaw);
  }
  const { sets, skipped, unmapped } = transformSets(setRaw);
  const { skills } = transformSkills(skillRaw);
  const { cpStars } = transformCpStars(cpRaw);
  const { grimoires, scripts } = transformScribing(grimoireRaw, scriptRaw);
  const { classMasteryLines } = transformClassMastery(skills);

  // Stable key order for reproducible diffs.
  const dataset = { patch, sets, skills, cpStars, grimoires, scripts, classMasteryLines };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(dataset, null, 2) + "\n");

  const ultimates = skills.filter((s) => s.ultimate).length;
  const slottables = cpStars.filter((s) => s.slottable).length;
  console.log("");
  console.log(`patch:     ${patch.code} (${patch.name}, released ~${patch.releasedAt})`);
  console.log(`sets:      ${sets.length} (skipped ${skipped} with type ""/Class/Other)`);
  const withDlc = sets.filter((s) => s.dlcRequired !== null).length;
  console.log(`set DLC:   ${withDlc} gated / ${sets.length - withDlc} base-or-unmapped`);
  if (unmapped.size) {
    console.log(`unmapped set sources (left null — extend PLACE_DLC to cover):`);
    for (const [place, n] of [...unmapped.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n.toString().padStart(3)}  ${place}`);
    }
  }
  console.log(`skills:    ${skills.length} (${ultimates} ultimates)`);
  console.log(`cpStars:   ${cpStars.length} (${slottables} slottable)`);
  const slotCounts = ["focus", "signature", "affix"]
    .map((slot) => `${scripts.filter((s) => s.slot === slot).length} ${slot}`)
    .join(", ");
  console.log(`scribing:  ${grimoires.length} grimoires, ${scripts.length} scripts (${slotCounts})`);
  const graftable = classMasteryLines.filter((m) => m.graftable).length;
  console.log(`mastery:   ${classMasteryLines.length} class lines (${graftable} graftable)`);
  console.log(`wrote ${path.relative(ROOT, OUT_FILE)}`);
}

// Run only when executed directly — the test suite imports resolveSetDlc.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
