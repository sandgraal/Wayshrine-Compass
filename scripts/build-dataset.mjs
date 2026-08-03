#!/usr/bin/env node
/**
 * build-dataset.mjs — builds public/dataset/current.json from UESP's esolog
 * JSON exports (https://esolog.uesp.net, CC-BY-SA).
 *
 * Usage:  node scripts/build-dataset.mjs
 *
 * Sources (fetched politely: identified User-Agent, 1s delay between requests):
 *   - exportJson.php?table=setSummary  -> gear sets
 *   - exportJson.php?table=skillTree   -> class skills (per-rank rows)
 *   - exportJson.php?table=cp2Skills   -> champion point stars
 *   - https://esoapi.uesp.net/         -> current game data version (v1010NN -> Update NN)
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
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "dataset");
const OUT_FILE = path.join(OUT_DIR, "current.json");

const USER_AGENT = "WayshrineCompass-dataset-builder/0.1 (contact: cennisc@gmail.com)";
const DELAY_MS = 1000;
const CACHE_DIR = process.env.UESP_CACHE_DIR || "";

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
    sets.push({
      id: `set-${row.indexName}`,
      name: row.setName,
      type,
      source: row.sources && row.sources.trim() ? row.sources.trim() : row.type,
      // UESP setSummary has no DLC field; left null (see public/dataset/README.md).
      dlcRequired: null,
      bonuses,
    });
  }
  sets.sort((a, b) => a.id.localeCompare(b.id));
  return { sets, skipped };
}

function transformSkills(raw) {
  const rows = JSON.parse(raw).skillTree;
  const skills = [];
  // Group per-rank rows by class line + base ability. skillTree encodes morphs
  // via rank: ranks 1-4 are the base ability, 5-8 morph one, 9-12 morph two
  // (verified against e.g. Crystal Shard -> Crystal Weapon / Crystal Fragments).
  const groups = new Map();
  for (const row of rows) {
    const [className, lineName] = String(row.skillTypeName).split("::");
    if (!CLASSES.includes(className) || !lineName) continue;
    const key = `${row.skillTypeName}::${row.baseName}`;
    if (!groups.has(key)) groups.set(key, { className, lineName, rows: [] });
    groups.get(key).rows.push(row);
  }
  const usedIds = new Map();
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
    let id = `skill-${kebab(baseName)}`;
    if (usedIds.has(id)) id = `${id}-${kebab(lineName)}`;
    usedIds.set(id, true);
    skills.push({
      id,
      name: baseName,
      line: kebab(lineName),
      lineLabel: lineName,
      ultimate: baseRow.type === "Ultimate",
      description: stripEsoCodes(baseRow.description),
      className: className.toLowerCase(),
      morphs,
    });
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
  const versionsRaw = await fetchText("https://esoapi.uesp.net/", "apiVersions");

  const patch = parsePatchFromVersions(versionsRaw);
  const { sets, skipped } = transformSets(setRaw);
  const { skills } = transformSkills(skillRaw);
  const { cpStars } = transformCpStars(cpRaw);

  // Stable key order for reproducible diffs.
  const dataset = { patch, sets, skills, cpStars };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(dataset, null, 2) + "\n");

  const ultimates = skills.filter((s) => s.ultimate).length;
  const slottables = cpStars.filter((s) => s.slottable).length;
  console.log("");
  console.log(`patch:     ${patch.code} (${patch.name}, released ~${patch.releasedAt})`);
  console.log(`sets:      ${sets.length} (skipped ${skipped} with type ""/Class/Other)`);
  console.log(`skills:    ${skills.length} (${ultimates} ultimates)`);
  console.log(`cpStars:   ${cpStars.length} (${slottables} slottable)`);
  console.log(`wrote ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
