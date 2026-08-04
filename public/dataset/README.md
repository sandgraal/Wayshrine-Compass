# Wayshrine Compass patch dataset

`current.json` is a `PatchDataset` (see `src/lib/ingest/parse.ts`) generated from
UESP's ESO log project exports.

## Source and attribution

Data from the UESP ESO log project (<https://esolog.uesp.net>), part of the
Unofficial Elder Scrolls Pages (<https://www.uesp.net>), licensed under
[CC-BY-SA](https://creativecommons.org/licenses/by-sa/2.5/). This dataset is a
transformed derivative of that data and carries the same attribution requirement.

Tables used: `setSummary` (gear sets), `skillTree` (class skills, per-rank rows),
`cp2Skills` (champion point stars), plus the version listing at
<https://esoapi.uesp.net/> to determine the current game update.

## Regenerating

```
node scripts/build-dataset.mjs
```

The script identifies itself with a contactable User-Agent and waits 1 second
between requests (4 requests total). esolog.uesp.net sits behind Cloudflare and
occasionally serves a JS challenge to non-browser clients; the script retries
once and can fall back to raw export files in `$UESP_CACHE_DIR`
(`setSummary.json`, `skillTree.json`, `cp2Skills.json`, `apiVersions.json`) if
set. If a fetch keeps failing, wait a bit and rerun.

## Mapping notes and known limitations

- **`dlcRequired` is derived from `sources`, not a DLC field** — UESP's
  `setSummary` export carries no DLC column (verified against the full column
  list; the `zones` table is not JSON-exportable), so the builder maps the
  place named in `sources` to a DLC id via an explicit `PLACE_DLC` table
  (ids from `src/data/zones.ts` `ALL_DLC_IDS`, cross-checked by test). Dungeon
  and trial sources read `"Zone, Dungeon"` where the zone is only the
  location — the *dungeon's* DLC gates the set (e.g. "Summerset, Coral Aerie"
  → `ascending-tide`, not `summerset`) — so lookups key on the last segment;
  monster sets key on the dungeon in `"Boss in Dungeon"`. Crafted sets stay
  `null` (the gear is tradeable and wearable without the DLC), as do mythics
  (fragment leads span many DLCs) and all base-game places. Any place name
  missing from the table stays `null` and is listed in the build summary so
  coverage gaps are visible instead of silent. 310 of 641 sets carry a DLC id
  at snapshot time.
- **Set types**: UESP `type` values Crafted/Overland/Dungeon/Trial/Arena/PVP/
  Monster/Mythic map to the site's lowercase enum. Rows typed `""`, `Class`, or
  `Other` (class sets, holiday/other oddities) are skipped; the build prints how
  many.
- **Set bonuses**: `setBonusDescN` strings of the form `"(N items) effect"` are
  parsed into `{pieces: N, effect}`. Mythics legitimately use `"(1 item) ..."`.
  Any row not matching the pattern is kept whole as `{pieces: 1, effect: raw}`.
- **Skills**: only the 7 class skill trees are included (no weapon/guild/world
  lines). `skillTree` encodes progression as ranks 1–12 of a base ability:
  ranks 1–4 are the base skill, 5–8 the first morph, 9–12 the second morph.
  Each skill's description comes from the max base rank (rank 4); each morph's
  from its max rank row. Ultimates are rows with `type == "Ultimate"` (verified
  against Dragon Leap, Negate Magic). Passives have no morphs. Each skill also
  carries `gameId` (the base ability's UESP `abilityId`) — a stable id the
  ingest diff engine uses to recognize a renamed skill definitively, since the
  display id derives from name + line and changes when a skill is renamed.
- **CP stars**: `disciplineIndex` 1 = craft, 2 = warfare, 3 = fitness (verified
  against Steed's Blessing, Deadly Aim/Master-at-Arms, Boundless Vitality).
  `slottable` is `skillType != 0` (0 = always-on passive; 1 and 2 are stars
  slotted on the champion bar). The `"Current bonus: ..."` tail of
  `maxDescription` is dropped, as are ESO `|c...|r` color codes everywhere.
- **Patch**: derived from the newest `v1010NN` dump on esoapi.uesp.net
  (API 1010NN = Update NN, e.g. v101050 = U50). `releasedAt` uses the dump's
  creation date, which trails the actual update release by a few days — treat
  it as approximate.
